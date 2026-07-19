import logging
from copy import deepcopy
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
    BasketItemContext,
    CustomerContext,
    RequestedItemContext,
)
from src.agents.shared.outputs import CustomerScenarioOutput, TutorAgentOutput
from src.contracts.gameplay_engine import (
    AnswerChallengeResponse,
    AnswerLiteracyChallengeResponse,
    BasketLineResponse,
    BasketResponse,
    BasketValidationResponse,
    ChallengeResponse,
    CheckoutResponse,
    CustomerResponse,
    HintResponse,
    InventoryItemResponse,
    LearningSummaryResponse,
    LiteracyChallengeResponse,
    MissionResponse,
    MotivationResponse,
    NextCustomerResponse,
    PlayerProgressResponse,
    ResolveStockOfferResponse,
    RewardResponse,
    SessionSummaryResponse,
    StartGameplaySessionResponse,
    ChatResponse,
)
from src.core.exceptions import ApplicationError
from src.database.models import GameSession, InventoryItem, Student, StudentProgress
from src.database.repositories.gameplay import GameplayRepository
from src.services.ai.orchestrator import AIOrchestrator
from src.services.gameplay.managers import (
    AchievementEngine,
    AdaptiveDifficultyEngine,
    BasketLine,
    BasketManager,
    BasketValidationManager,
    CustomerQueueManager,
    LearningSummaryManager,
    LiteracyChallengeManager,
    MathChallengeManager,
    MissionProgressEngine,
    MotivationManager,
    ProgressTracker,
    ScoringEngine,
    ShopInventoryManager,
    XpCoinsEngine,
)


class GameplayEngine:
    def __init__(self, session: AsyncSession, orchestrator: AIOrchestrator | None = None) -> None:
        self.session = session
        self.orchestrator = orchestrator
        self.repository = GameplayRepository(session)
        self.inventory = ShopInventoryManager()
        self.customer_queue = CustomerQueueManager()
        self.basket = BasketManager()
        self.basket_validation = BasketValidationManager()
        self.challenges = MathChallengeManager()
        self.scoring = ScoringEngine()
        self.rewards = XpCoinsEngine()
        self.achievements = AchievementEngine()
        self.missions = MissionProgressEngine()
        self.motivation = MotivationManager()
        self.progress_tracker = ProgressTracker()
        self.difficulty = AdaptiveDifficultyEngine()
        self.literacy = LiteracyChallengeManager()
        self.summary_builder = LearningSummaryManager()

    async def start_session(self) -> StartGameplaySessionResponse:
        student = await self._demo_student()
        if await self.repository.get_shop(student.id) is None:
            raise ApplicationError("Create your duka before starting a session.", status_code=409)
        progress = await self._ensure_progress(student)
        motivation = self._start_daily_motivation(progress, student)
        state = self._initial_state()
        game_session = await self.repository.create_session(student.id, state)
        await self.session.commit()
        return StartGameplaySessionResponse(
            session_id=game_session.id,
            student_name=student.display_name,
            started_at=game_session.started_at,
            mission=self._mission(state),
            motivation=MotivationResponse.model_validate(motivation),
        )

    async def next_customer(self, session_id: UUID) -> NextCustomerResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        if state["current_customer"] is not None:
            raise ApplicationError(
                "Finish the current customer before serving the next one.", status_code=409
            )
        shop_stock = await self.repository.list_shop_stock(student.id)
        items = [item for _, item in shop_stock]
        if not items:
            raise ApplicationError(
                "Add products to your duka before serving customers.", status_code=409
            )
        scenario = await self._next_customer_scenario(game_session, student, state)
        state["request_version"] = int(state.get("request_version", 0)) + 1
        if scenario is None:
            # A malformed or unavailable AI response should not prevent a child from
            # continuing the game. The local queue only uses the shop's real stock.
            state["current_customer"] = self.customer_queue.next(
                int(state["customers_served"]), items
            )
            state["current_customer"]["request_version"] = int(state["request_version"])
            state["basket"] = []
            state["chat_history"] = []
            state["challenge"] = None
            self._prepare_stock_offer(state["current_customer"], shop_stock)
            self._prepare_literacy_challenge(state, student, items)
            await self._save(game_session, state)
            return NextCustomerResponse(
                customer=self._customer_response(state),
                basket=await self._basket_response(state),
                mission=self._mission(state),
                literacy_challenge=self._literacy_response(state),
            )

        matched = {item.name.casefold(): item for item in items}
        requested_items = [
            {
                "item_id": str(matched[order.item_name.casefold()].id),
                "name": matched[order.item_name.casefold()].name,
                "quantity": order.quantity,
            }
            for order in scenario.shopping_list
            if order.item_name.casefold() in matched
        ]
        if len(requested_items) != len(scenario.shopping_list):
            raise ApplicationError(
                "Customer Agent selected a product outside this duka.", status_code=502
            )
        request = ", ".join(
            f"{item['quantity']} {str(item['name']).lower()}" for item in requested_items
        )
        state["current_customer"] = {
            "id": str(uuid4()),
            "name": scenario.customer_name,
            "personality": "busy" if scenario.mood == "rushed" else scenario.mood,
            "greeting": scenario.dialogue,
            "request": f"I need {request}, please.",
            "requested_items": requested_items,
            "checkout_question": scenario.checkout_question,
            "payment_amount_kes": scenario.payment_amount_kes,
            "request_version": int(state["request_version"]),
        }
        state["basket"] = []
        state["chat_history"] = []
        state["challenge"] = None
        self._prepare_stock_offer(state["current_customer"], shop_stock)
        self._prepare_literacy_challenge(state, student, items)
        await self._save(game_session, state)
        return NextCustomerResponse(
            customer=self._customer_response(state),
            basket=await self._basket_response(state),
            mission=self._mission(state),
            literacy_challenge=self._literacy_response(state),
        )

    async def resolve_stock_offer(self, session_id: UUID) -> ResolveStockOfferResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        customer = self._require_customer(state)
        offer = customer.get("stock_offer")
        if not isinstance(offer, dict) or offer.get("status") != "pending":
            raise ApplicationError(
                "There is no pending stock offer for this customer.", status_code=409
            )
        stock_rows = await self.repository.list_shop_stock(student.id)
        item_by_name = {item.name.casefold(): (stock, item) for stock, item in stock_rows}
        available_goods = [item.name for stock, item in stock_rows if stock.stock > 0]
        decision = await self._stock_offer_decision(game_session, student, state, available_goods)
        requested = [item for item in customer["requested_items"] if isinstance(item, dict)]
        target = next(item for item in requested if str(item["item_id"]) == str(offer["item_id"]))
        if decision is not None and not decision.accepts_available_quantity:
            replacement = item_by_name.get((decision.replacement_item_name or "").casefold())
            if replacement is not None and replacement[0].stock > 0:
                stock, item = replacement
                target.update(
                    {
                        "item_id": str(item.id),
                        "name": item.name,
                        "quantity": min(int(target["quantity"]), stock.stock),
                    }
                )
                offer.update({"status": "replaced", "message": decision.dialogue})
            else:
                target["quantity"] = int(offer["available_quantity"])
                offer.update(
                    {"status": "accepted", "message": "I can take what you have today, thank you."}
                )
        else:
            target["quantity"] = int(offer["available_quantity"])
            offer.update(
                {
                    "status": "accepted",
                    "message": decision.dialogue
                    if decision
                    else "I can take what you have today, thank you.",
                }
            )
        customer["request"] = (
            "I need "
            + ", ".join(f"{item['quantity']} {str(item['name']).lower()}" for item in requested)
            + ", please."
        )
        customer["greeting"] = str(offer["message"])
        
        chat_history = state.setdefault("chat_history", [])
        offer_msg = (
            f"I only have {offer['available_quantity']} {str(offer['name']).lower()} left. "
            f"Would you like to take that amount instead?"
        )
        chat_history.append({"sender": "shopkeeper", "message": offer_msg})
        chat_history.append({"sender": "customer", "message": str(offer["message"])})
        
        state["request_version"] = int(state.get("request_version", 0)) + 1
        customer["request_version"] = int(state["request_version"])
        self._prepare_literacy_challenge(
            state, student, [item for _, item in stock_rows]
        )
        await self._save(game_session, state)
        return ResolveStockOfferResponse(
            customer=self._customer_response(state),
            basket=await self._basket_response(state),
            literacy_challenge=self._literacy_response(state),
        )

    async def list_inventory(self, session_id: UUID) -> list[InventoryItemResponse]:
        _, student = await self._session_and_student(session_id)
        return [
            self._item_response(item, stock.stock)
            for stock, item in await self.repository.list_shop_stock(student.id)
        ]

    async def get_basket(self, session_id: UUID) -> BasketResponse:
        game_session, student = await self._session_and_student(session_id)
        return await self._basket_response(self._state(game_session))

    async def add_basket_item(
        self, session_id: UUID, item_id: UUID, quantity: int
    ) -> BasketResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        self._require_customer(state)
        shop_stock = await self.repository.get_shop_stock(student.id, item_id)
        item = await self.repository.get_inventory_item(item_id)
        if item is None or shop_stock is None or shop_stock.stock < 1:
            raise ApplicationError("Inventory item was not found.", status_code=404)
        lines = self._lines(state)
        try:
            updated = self.basket.add(lines, item_id, quantity, shop_stock.stock)
        except ValueError as error:
            raise ApplicationError(str(error), status_code=409) from error
        state["basket"] = self._serialize_lines(updated)
        await self._save(game_session, state)
        return await self._basket_response(state)

    async def remove_basket_item(self, session_id: UUID, item_id: UUID) -> BasketResponse:
        game_session, _ = await self._session_and_student(session_id)
        state = self._state(game_session)
        state["basket"] = self._serialize_lines(self.basket.remove(self._lines(state), item_id))
        await self._save(game_session, state)
        return await self._basket_response(state)

    async def current_challenge(self, session_id: UUID) -> ChallengeResponse | None:
        game_session, _ = await self._session_and_student(session_id)
        challenge = self._state(game_session)["challenge"]
        return self._challenge_response(challenge) if isinstance(challenge, dict) else None

    async def current_literacy_challenge(self, session_id: UUID) -> LiteracyChallengeResponse | None:
        game_session, _ = await self._session_and_student(session_id)
        return self._literacy_response(self._state(game_session))

    async def submit_literacy_answer(
        self, session_id: UUID, answer: str
    ) -> AnswerLiteracyChallengeResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        challenge = self._require_literacy_challenge(state)
        if bool(challenge["complete"]):
            raise ApplicationError("That customer message is already complete.", status_code=409)
        if not self._literacy_is_available(state, challenge):
            raise ApplicationError(
                "Add the matching product to the basket before spelling it.", status_code=409
            )

        challenge["attempts"] = int(challenge["attempts"]) + 1
        correct = self.literacy.is_correct(challenge, answer)
        if correct:
            challenge["complete"] = True
        reward = await self._record_learning_attempt(
            student,
            state,
            correct=correct,
            attempts=int(challenge["attempts"]),
            hints=0,
            success_message="Your careful reading earns a reward!",
            retry_message="Trying again strengthens your reading skills!",
            activity="literacy",
        )
        await self._save(game_session, state)
        response_challenge = self._literacy_response(state)
        if response_challenge is None:
            raise ApplicationError("Literacy challenge was not found.", status_code=409)
        customer = self._require_customer(state)
        return AnswerLiteracyChallengeResponse(
            is_correct=correct,
            feedback=self.literacy.feedback(challenge, correct, str(customer["name"])),
            attempts=int(challenge["attempts"]),
            challenge_complete=correct,
            challenge=response_challenge,
            rewards_preview=reward,
        )

    async def request_hint(self, session_id: UUID) -> HintResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        challenge = self._require_challenge(state)
        if bool(challenge["complete"]):
            raise ApplicationError("The challenge is already complete.", status_code=409)
        challenge["hints_used"] = int(challenge["hints_used"]) + 1
        state["hints_used"] = int(state["hints_used"]) + 1
        await self._save(game_session, state)
        advice = await self._tutor_advice(game_session, student, state)
        if advice is not None:
            return HintResponse(
                hint=advice.tutor.hint,
                encouragement=advice.tutor.encouragement,
                hints_used=int(challenge["hints_used"]),
            )
        return HintResponse(
            hint=self.challenges.hint(challenge),
            encouragement="You can do this—one small step at a time.",
            hints_used=int(challenge["hints_used"]),
        )

    async def submit_answer(self, session_id: UUID, answer: int) -> AnswerChallengeResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        challenge = self._require_challenge(state)
        if bool(challenge["complete"]):
            raise ApplicationError("The challenge is already complete.", status_code=409)
        challenge["attempts"] = int(challenge["attempts"]) + 1
        correct = answer == int(challenge["answer"])
        if correct:
            challenge["complete"] = True
        reward = await self._record_learning_attempt(
            student,
            state,
            correct=correct,
            attempts=int(challenge["attempts"]),
            hints=int(challenge["hints_used"]),
            success_message="Your persistence earns rewards!",
            retry_message="Trying again builds your skills!",
            activity="math",
        )
        await self._save(game_session, state)
        return AnswerChallengeResponse(
            is_correct=correct,
            feedback=self.scoring.feedback(correct, int(challenge["attempts"]), challenge),
            attempts=int(challenge["attempts"]),
            challenge_complete=correct,
            rewards_preview=reward,
        )

    async def checkout(self, session_id: UUID) -> CheckoutResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        self._require_customer(state)
        basket = await self._basket_response(state)
        if not basket.lines:
            raise ApplicationError("Add at least one item before checkout.", status_code=422)
        if not basket.validation.is_valid:
            raise ApplicationError(basket.validation.tutor_feedback, status_code=409)
        literacy = state.get("literacy_challenge")
        if (
            isinstance(literacy, dict)
            and not bool(literacy.get("complete"))
            and self._literacy_is_available(state, literacy)
        ):
            raise ApplicationError(
                "Finish the customer's quick reading moment before checking out.", status_code=409
            )
        challenge = state["challenge"]
        if not isinstance(challenge, dict):
            recommended_tier = state.get("recommended_tier")
            customer_data = state.get("current_customer")
            state["challenge"] = self.challenges.create_checkout_challenge(
                basket.total_kes,
                int(recommended_tier)
                if isinstance(recommended_tier, int)
                else student.difficulty_tier,
                customer=customer_data if isinstance(customer_data, dict) else None,
                basket_lines=[
                    {
                        "name": line.item.name,
                        "quantity": line.quantity,
                        "price_kes": line.item.price_kes,
                    }
                    for line in basket.lines
                ],
            )
            await self._save(game_session, state)
            return CheckoutResponse(
                status="challenge_required",
                challenge=self._challenge_response(state["challenge"]),
                mission=self._mission(state),
                next_customer_available=False,
            )
        if not bool(challenge["complete"]):
            return CheckoutResponse(
                status="challenge_required",
                challenge=self._challenge_response(challenge),
                mission=self._mission(state),
                next_customer_available=False,
            )
        for line in self._lines(state):
            shop_stock = await self.repository.get_shop_stock(student.id, line.item_id)
            if shop_stock is None or shop_stock.stock < line.quantity:
                raise ApplicationError(
                    "An item is no longer available in the requested quantity.", status_code=409
                )
            shop_stock.stock -= line.quantity
        customer = state["current_customer"]
        customer_name = (
            str(customer.get("name", "a customer")) if isinstance(customer, dict) else "a customer"
        )
        await self.repository.record_sale(
            student.id, int(challenge.get("amount_due_kes", basket.total_kes)), customer_name
        )
        state["customers_served"] = int(state["customers_served"]) + 1
        state["achievements"] = self.achievements.update(
            int(state["customers_served"]),
            True,
            int(challenge["hints_used"]),
            list(state["achievements"]),
        )
        progress = await self._ensure_progress(student)
        motivation_state = self._start_daily_motivation(progress, student)
        motivation_state, mission_completed_today = self.motivation.record_event(
            motivation_state, "sales"
        )
        motivation_state, new_badges = self.motivation.award_for_event(motivation_state, "sale")
        if mission_completed_today:
            progress.missions_completed += 1
        progress.motivation_state = motivation_state
        state["achievements"] = self._append_achievement_names(state["achievements"], new_badges)
        mission_before = bool(state["mission_completed"])
        state["mission_completed"] = int(state["customers_served"]) >= 3
        if bool(state["mission_completed"]) and not mission_before:
            progress = await self.repository.get_progress(student.id)
            if progress is not None:
                progress.missions_completed += 1
        state["current_customer"] = None
        state["basket"] = []
        state["challenge"] = None
        await self._save(game_session, state)
        reward = RewardResponse(
            coins=0, xp=0, stars=0, message="Sale complete—your customer is smiling!"
        )
        return CheckoutResponse(
            status="completed",
            reward=reward,
            mission=self._mission(state),
            next_customer_available=True,
        )

    async def chat(self, session_id: UUID, message: str) -> ChatResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        customer = self._require_customer(state)
        
        chat_history = state.setdefault("chat_history", [])
        chat_history.append({"sender": "shopkeeper", "message": message})
        
        if self.orchestrator is None:
            return ChatResponse(reply="I am not sure what to say right now.")

        inventory_items = [item for _, item in await self.repository.list_shop_stock(student.id)]
        context = await self._agent_context(
            game_session, student, state, [item.name for item in inventory_items]
        )
        
        # Inject the user message into the context as a recent shopkeeper action.
        context.progress.basket_feedback = f"The shopkeeper says: {message}"

        try:
            response = await self.orchestrator.chat_with_customer(context)
            chat_history.append({"sender": "customer", "message": response.reply})
            await self._save(game_session, state)
            return ChatResponse(reply=response.reply, sentiment=response.sentiment)
        except Exception:
            logging.getLogger(__name__).exception("Customer chat failed.")
            fallback_reply = customer.get("greeting") or "Sorry, I am a bit distracted right now."
            chat_history.append({"sender": "customer", "message": fallback_reply})
            await self._save(game_session, state)
            return ChatResponse(reply=fallback_reply, sentiment="neutral")

    async def summary(self, session_id: UUID) -> SessionSummaryResponse:
        game_session, _ = await self._session_and_student(session_id)
        state = self._state(game_session)
        return SessionSummaryResponse(
            session_id=session_id,
            customers_served=int(state["customers_served"]),
            questions_attempted=int(state["questions_attempted"]),
            correct_answers=int(state["correct_answers"]),
            hints_used=int(state["hints_used"]),
            coins_earned=int(state["coins_earned"]),
            xp_earned=int(state["xp_earned"]),
            stars_earned=int(state["stars_earned"]),
            achievements=list(state["achievements"]),
            mission=self._mission(state),
        )

    async def player_progress(self) -> PlayerProgressResponse:
        student = await self._demo_student()
        progress = await self._ensure_progress(student)
        motivation = self._start_daily_motivation(progress, student)
        await self.session.commit()
        return PlayerProgressResponse(
            student_name=student.display_name,
            questions_attempted=progress.questions_attempted,
            correct_answers=progress.questions_correct,
            hints_used=progress.hints_used,
            time_spent_seconds=progress.time_spent_seconds,
            coins_earned=progress.coins_earned,
            xp_earned=progress.xp_earned,
            stars_earned=progress.stars_earned,
            missions_completed=progress.missions_completed,
            current_learning_level=progress.current_learning_level,
            skills_improving=self.progress_tracker.skills_improving(progress.questions_correct),
            daily_streak_days=int(motivation["current_streak_days"]),
        )

    async def motivation_summary(self) -> MotivationResponse:
        student = await self._demo_student()
        progress = await self._ensure_progress(student)
        motivation = self._start_daily_motivation(progress, student)
        await self.session.commit()
        return MotivationResponse.model_validate(motivation)

    async def learning_summary(self) -> LearningSummaryResponse:
        student = await self._demo_student()
        progress = await self._ensure_progress(student)
        motivation = self._start_daily_motivation(progress, student)
        await self.session.commit()
        badges = motivation.get("badges", [])
        return LearningSummaryResponse.model_validate(
            self.summary_builder.build(
                student_name=student.display_name,
                questions_attempted=progress.questions_attempted,
                correct_answers=progress.questions_correct,
                hints_used=progress.hints_used,
                learning_level=progress.current_learning_level,
                streak_days=int(motivation["current_streak_days"]),
                badges=[badge for badge in badges if isinstance(badge, dict)]
                if isinstance(badges, list)
                else [],
                literacy_moments_completed=progress.literacy_moments_completed,
                skills_improving=self.progress_tracker.skills_improving(progress.questions_correct),
            )
        )

    def _customer_response(self, state: dict[str, object]) -> CustomerResponse:
        customer_data = dict(state["current_customer"])
        customer_data["chat_history"] = state.get("chat_history", [])
        return CustomerResponse.model_validate(customer_data)

    async def _basket_response(self, state: dict[str, object]) -> BasketResponse:
        responses: list[BasketLineResponse] = []
        for line in self._lines(state):
            item = await self.repository.get_inventory_item(line.item_id)
            if item is not None:
                responses.append(
                    BasketLineResponse(
                        item=self._item_response(item),
                        quantity=line.quantity,
                        line_total_kes=self.inventory.price(item) * line.quantity,
                    )
                )
        selected = [
            {
                "item_id": str(line.item.id),
                "name": line.item.name,
                "quantity": line.quantity,
            }
            for line in responses
        ]
        customer = state["current_customer"]
        validation = self.basket_validation.validate(
            customer if isinstance(customer, dict) else None, selected
        )
        return BasketResponse(
            lines=responses,
            total_kes=sum(line.line_total_kes for line in responses),
            validation=BasketValidationResponse.model_validate(validation),
            literacy_challenge=self._literacy_response(state),
            request_version=(
                int(customer.get("request_version", state.get("request_version", 0)))
                if isinstance(customer, dict)
                else int(state.get("request_version", 0))
            ),
        )

    async def _record_learning_attempt(
        self,
        student: Student,
        state: dict[str, object],
        *,
        correct: bool,
        attempts: int,
        hints: int,
        success_message: str,
        retry_message: str,
        activity: str,
    ) -> RewardResponse:
        state["questions_attempted"] = int(state["questions_attempted"]) + 1
        if correct:
            state["correct_answers"] = int(state["correct_answers"]) + 1
        coins, xp, stars = self.rewards.reward(correct, attempts, hints)
        state["coins_earned"] = int(state["coins_earned"]) + coins
        state["xp_earned"] = int(state["xp_earned"]) + xp
        state["stars_earned"] = int(state["stars_earned"]) + stars
        state["difficulty_attempts"] = int(state.get("difficulty_attempts", 0)) + 1
        state["difficulty_correct"] = int(state.get("difficulty_correct", 0)) + int(correct)
        current_tier = int(state.get("recommended_tier") or student.difficulty_tier)
        adjusted_tier = self.difficulty.adjust(
            current_tier,
            int(state["difficulty_attempts"]),
            int(state["difficulty_correct"]),
        )
        state["recommended_tier"] = adjusted_tier
        if adjusted_tier != current_tier:
            state["difficulty_attempts"] = 0
            state["difficulty_correct"] = 0
        new_badges = await self._update_progress(
            student, state, coins, xp, stars, correct, activity=activity, hints=hints
        )
        state["achievements"] = self._append_achievement_names(state["achievements"], new_badges)
        reward_message = state.get("reward_message")
        return RewardResponse(
            coins=coins,
            xp=xp,
            stars=stars,
            message=(
                reward_message
                if isinstance(reward_message, str)
                else success_message if correct else retry_message
            ),
        )

    async def _update_progress(
        self,
        student: Student,
        state: dict[str, object],
        coins: int,
        xp: int,
        stars: int,
        correct: bool,
        *,
        activity: str,
        hints: int,
    ) -> list[dict[str, str]]:
        progress = await self._ensure_progress(student)
        progress.questions_attempted += 1
        progress.questions_correct += int(correct)
        progress.hints_used = int(state["hints_used"])
        progress.coins_earned += coins
        progress.xp_earned += xp
        progress.stars_earned += stars
        progress.current_learning_level = int(
            state.get("recommended_tier") or student.difficulty_tier
        )
        if correct and activity == "literacy":
            progress.literacy_moments_completed += 1
        if not correct:
            return []
        motivation_state = self._start_daily_motivation(progress, student)
        motivation_state, mission_completed_today = self.motivation.record_event(
            motivation_state, activity
        )
        motivation_state, new_badges = self.motivation.award_for_event(
            motivation_state, activity, used_hint=hints > 0
        )
        if mission_completed_today:
            progress.missions_completed += 1
        progress.motivation_state = motivation_state
        return new_badges

    async def _ensure_progress(self, student: Student) -> StudentProgress:
        progress = await self.repository.get_progress(student.id)
        if progress is None:
            progress = StudentProgress(student_id=student.id)
            self.session.add(progress)
            await self.session.flush()
        return progress

    def _start_daily_motivation(
        self, progress: StudentProgress, student: Student
    ) -> dict[str, object]:
        seed = sum(student.id.bytes)
        state = self.motivation.start_day(
            progress.motivation_state if isinstance(progress.motivation_state, dict) else {},
            datetime.now(UTC).date(),
            seed,
        )
        progress.motivation_state = state
        return state

    @staticmethod
    def _append_achievement_names(
        existing: object, new_badges: list[dict[str, str]]
    ) -> list[str]:
        achievements = [str(name) for name in existing] if isinstance(existing, list) else []
        for badge in new_badges:
            if badge["name"] not in achievements:
                achievements.append(badge["name"])
        return achievements

    async def _save(self, game_session: GameSession, state: dict[str, object]) -> None:
        # SQLAlchemy does not reliably detect nested in-place changes to a JSON
        # column. Assigning a fresh value guarantees customer decisions persist
        # before the next basket request reloads the session.
        await self.repository.save_game_state(game_session, deepcopy(state))
        await self.session.commit()

    async def _next_customer_scenario(
        self, game_session: GameSession, student: Student, state: dict[str, object]
    ) -> CustomerScenarioOutput | None:
        if self.orchestrator is None:
            return None
        served = int(state["customers_served"])
        cached = state.get("customer_scenarios")
        if isinstance(cached, list) and served % 5 != 0 and served % 5 < len(cached):
            try:
                return CustomerScenarioOutput.model_validate(cached[served % 5])
            except ValueError:
                state["customer_scenarios"] = []
        inventory_items = [item for _, item in await self.repository.list_shop_stock(student.id)]
        context = await self._agent_context(
            game_session, student, state, [item.name for item in inventory_items]
        )
        try:
            batch = await self.orchestrator.generate_customer_batch(context)
            state["customer_scenarios"] = [scenario.model_dump() for scenario in batch.scenarios]
            return batch.scenarios[0]
        except Exception:
            logging.getLogger(__name__).exception(
                "Customer batch failed; continuing gameplay with local content."
            )
            return None

    async def _tutor_advice(
        self, game_session: GameSession, student: Student, state: dict[str, object]
    ) -> TutorAgentOutput | None:
        if self.orchestrator is None:
            return None
        inventory_items = [item for _, item in await self.repository.list_shop_stock(student.id)]
        try:
            context = await self._agent_context(
                game_session, student, state, [item.name for item in inventory_items]
            )
            return await self.orchestrator.tutor(context)
        except Exception:
            logging.getLogger(__name__).exception(
                "Tutor intervention failed; using the deterministic hint."
            )
            return None

    async def _agent_context(
        self,
        game_session: GameSession,
        student: Student,
        state: dict[str, object],
        available_goods: list[str],
    ) -> AgentContext:
        basket = await self._basket_response(state)
        customer_data = state.get("current_customer")
        customer_ctx = None
        if isinstance(customer_data, dict):
            requested_items = []
            for item in customer_data.get("requested_items", []):
                requested_items.append(
                    RequestedItemContext(
                        item_id=str(item.get("item_id", "")),
                        name=str(item.get("name", "")),
                        quantity=int(item.get("quantity", 0)),
                    )
                )
            customer_ctx = CustomerContext(
                id=str(customer_data.get("id", "")),
                name=str(customer_data.get("name", "")),
                personality=str(customer_data.get("personality", "")),
                greeting=str(customer_data.get("greeting", "")),
                request=str(customer_data.get("request", "")),
                requested_items=requested_items,
            )

        basket_items = []
        for line in basket.lines:
            basket_items.append(
                BasketItemContext(
                    name=line.item.name,
                    quantity=line.quantity,
                )
            )

        from src.agents.shared.context import ChatMessageContext
        chat_history_ctx = [
            ChatMessageContext(sender=msg["sender"], message=msg["message"])
            for msg in state.get("chat_history", [])
            if isinstance(msg, dict)
        ]

        return AgentContext(
            learner=LearnerProfile(
                student_id=student.id,
                age=student.age,
                # Localization remains represented in the context, but is
                # bypassed for the hackathon's English-only runtime.
                language="en",
                difficulty_tier=int(state.get("recommended_tier") or student.difficulty_tier),
            ),
            session=GameplaySessionContext(
                session_id=game_session.id,
                started_at=game_session.started_at or datetime.now(UTC),
                transactions_completed=int(state["customers_served"]),
                last_skill=(
                    str(state["challenge"]["skill"])
                    if isinstance(state["challenge"], dict)
                    else None
                ),
            ),
            progress=ProgressContext(
                attempts=int(state["questions_attempted"]),
                correct_attempts=int(state["correct_answers"]),
                basket_feedback=basket.validation.tutor_feedback,
            ),
            mission=MissionContext(
                progress_value=int(state["customers_served"]), target_value=3, mission_type="sales"
            ),
            available_goods=available_goods,
            customer=customer_ctx,
            basket=basket_items,
            chat_history=chat_history_ctx,
        )

    async def _demo_student(self) -> Student:
        student = await self.repository.get_demo_student()
        if student is None:
            raise ApplicationError("Demo profile is not available.", status_code=503)
        return student

    async def _session_and_student(self, session_id: UUID) -> tuple[GameSession, Student]:
        game_session = await self.repository.get_active_session(session_id)
        if game_session is None:
            raise ApplicationError("Active session was not found.", status_code=404)
        student = await self.session.get(Student, game_session.student_id)
        if student is None:
            raise ApplicationError("Student was not found.", status_code=404)
        return game_session, student

    @staticmethod
    def _initial_state() -> dict[str, object]:
        return {
            "current_customer": None,
            "basket": [],
            "challenge": None,
            "customers_served": 0,
            "questions_attempted": 0,
            "correct_answers": 0,
            "hints_used": 0,
            "coins_earned": 0,
            "xp_earned": 0,
            "stars_earned": 0,
            "achievements": [],
            "mission_completed": False,
            "recommended_tier": None,
            "difficulty_attempts": 0,
            "difficulty_correct": 0,
            "agent_mission": None,
            "reward_message": None,
            "learning_insight": None,
            "customer_scenarios": [],
            "literacy_challenge": None,
            "request_version": 0,
        }

    @staticmethod
    def _state(game_session: GameSession) -> dict[str, object]:
        return dict(game_session.game_state or GameplayEngine._initial_state())

    def _prepare_literacy_challenge(
        self,
        state: dict[str, object],
        student: Student,
        available_items: list[InventoryItem],
    ) -> None:
        customer = state.get("current_customer")
        if not isinstance(customer, dict):
            state["literacy_challenge"] = None
            return
        stock_offer = customer.get("stock_offer")
        if isinstance(stock_offer, dict) and stock_offer.get("status") == "pending":
            state["literacy_challenge"] = None
            return
        state["literacy_challenge"] = self.literacy.create(
            customer,
            tier=int(state.get("recommended_tier") or student.difficulty_tier),
            age=student.age,
            served=int(state.get("customers_served", 0)),
            available_item_names=[item.name for item in available_items],
        )

    def _literacy_response(
        self, state: dict[str, object]
    ) -> LiteracyChallengeResponse | None:
        challenge = state.get("literacy_challenge")
        if not isinstance(challenge, dict):
            return None
        choices = challenge.get("choices", [])
        letters = challenge.get("letter_options", [])
        return LiteracyChallengeResponse(
            id=str(challenge["id"]),
            type=str(challenge["type"]),
            prompt=str(challenge["prompt"]),
            content=str(challenge["content"]),
            choices=choices if isinstance(choices, list) else [],
            letter_options=letters if isinstance(letters, list) else [],
            difficulty_tier=int(challenge["difficulty_tier"]),
            attempts=int(challenge["attempts"]),
            complete=bool(challenge["complete"]),
            is_available=self._literacy_is_available(state, challenge),
        )

    def _literacy_is_available(
        self, state: dict[str, object], challenge: dict[str, object]
    ) -> bool:
        if challenge.get("type") != "spelling":
            return True
        target_item_id = challenge.get("target_item_id")
        basket = state.get("basket")
        if not isinstance(basket, list):
            return False
        return any(
            isinstance(line, dict) and str(line.get("item_id")) == str(target_item_id)
            for line in basket
        )

    @staticmethod
    def _lines(state: dict[str, object]) -> list[BasketLine]:
        return [
            BasketLine(item_id=UUID(str(line["item_id"])), quantity=int(line["quantity"]))
            for line in state["basket"]
            if isinstance(line, dict)
        ]

    @staticmethod
    def _serialize_lines(lines: list[BasketLine]) -> list[dict[str, object]]:
        return [{"item_id": str(line.item_id), "quantity": line.quantity} for line in lines]

    def _mission(self, state: dict[str, object]) -> MissionResponse:
        agent_mission = state.get("agent_mission")
        if isinstance(agent_mission, dict):
            target = int(agent_mission["target"])
            return MissionResponse(
                title=str(agent_mission["title"]),
                progress=min(int(state["customers_served"]), target),
                target=target,
                completed=int(state["customers_served"]) >= target,
            )
        return MissionResponse.model_validate(
            self.missions.progress(int(state["customers_served"]))
        )

    @staticmethod
    def _item_response(item: InventoryItem, stock: int | None = None) -> InventoryItemResponse:
        return InventoryItemResponse(
            id=item.id,
            name=item.name,
            category=item.category,
            price_kes=ShopInventoryManager.price(item),
            image_placeholder=item.image_placeholder,
            stock=stock if stock is not None else item.stock,
            educational_tags=item.educational_tags,
        )

    @staticmethod
    def _challenge_response(challenge: dict[str, object]) -> ChallengeResponse:
        return ChallengeResponse(
            id=str(challenge["id"]),
            prompt=str(challenge["prompt"]),
            skill=str(challenge["skill"]),
            difficulty_tier=int(challenge["difficulty_tier"]),
            attempts=int(challenge["attempts"]),
            hints_used=int(challenge["hints_used"]),
            total_kes=int(challenge["total_kes"]),
            amount_due_kes=int(challenge.get("amount_due_kes", challenge["total_kes"])),
            amount_paid_kes=int(challenge["amount_paid_kes"]),
            discount_kes=int(challenge.get("discount_kes", 0)),
        )

    @staticmethod
    def _require_customer(state: dict[str, object]) -> dict[str, object]:
        customer = state["current_customer"]
        if not isinstance(customer, dict):
            raise ApplicationError("Serve the next customer first.", status_code=409)
        return customer

    @staticmethod
    def _prepare_stock_offer(
        customer: object, stock_rows: list[tuple[object, InventoryItem]]
    ) -> None:
        if not isinstance(customer, dict):
            return
        stock_by_id = {str(item.id): stock.stock for stock, item in stock_rows}
        for requested in customer.get("requested_items", []):
            if isinstance(requested, dict) and int(requested["quantity"]) > stock_by_id.get(
                str(requested["item_id"]), 0
            ):
                available = stock_by_id.get(str(requested["item_id"]), 0)
                customer["stock_offer"] = {
                    "item_id": str(requested["item_id"]),
                    "name": requested["name"],
                    "requested_quantity": requested["quantity"],
                    "available_quantity": available,
                    "status": "pending",
                    "message": f"We only have {available} {str(requested['name']).lower()} left. Would you like to offer that amount to the customer?",
                }
                return
        customer["stock_offer"] = None

    async def _stock_offer_decision(
        self,
        game_session: GameSession,
        student: Student,
        state: dict[str, object],
        available_goods: list[str],
    ) -> object | None:
        if self.orchestrator is None:
            return None
        customer = self._require_customer(state)
        offer = customer["stock_offer"]
        try:
            return await self.orchestrator.resolve_stock_offer(
                AgentContext(
                    learner=LearnerProfile(
                        student_id=student.id,
                        age=student.age,
                        language="en",
                        difficulty_tier=student.difficulty_tier,
                    ),
                    session=GameplaySessionContext(
                        session_id=game_session.id,
                        started_at=game_session.started_at or datetime.now(UTC),
                        transactions_completed=int(state["customers_served"]),
                    ),
                    progress=ProgressContext(
                        basket_feedback=f"{customer['name']} requested {offer['requested_quantity']} {offer['name']}; only {offer['available_quantity']} are available. Decide whether to accept the offered amount or request a replacement."
                    ),
                    mission=MissionContext(
                        progress_value=int(state["customers_served"]),
                        target_value=3,
                        mission_type="sales",
                    ),
                    available_goods=available_goods,
                )
            )
        except Exception:
            logging.getLogger(__name__).exception(
                "Customer stock decision failed; using a safe local response."
            )
            return None

    @staticmethod
    def _require_challenge(state: dict[str, object]) -> dict[str, object]:
        challenge = state["challenge"]
        if not isinstance(challenge, dict):
            raise ApplicationError("Start checkout to receive a math challenge.", status_code=409)
        return challenge

    @staticmethod
    def _require_literacy_challenge(state: dict[str, object]) -> dict[str, object]:
        challenge = state.get("literacy_challenge")
        if not isinstance(challenge, dict):
            raise ApplicationError("Serve a customer to receive a reading moment.", status_code=409)
        return challenge
