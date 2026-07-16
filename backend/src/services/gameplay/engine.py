from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)
from src.contracts.gameplay_engine import (
    AnswerChallengeResponse,
    BasketLineResponse,
    BasketResponse,
    BasketValidationResponse,
    ChallengeResponse,
    CheckoutResponse,
    CustomerResponse,
    HintResponse,
    InventoryItemResponse,
    MissionResponse,
    NextCustomerResponse,
    PlayerProgressResponse,
    RewardResponse,
    SessionSummaryResponse,
    StartGameplaySessionResponse,
)
from src.core.exceptions import ApplicationError
from src.database.models import GameSession, InventoryItem, Student, StudentProgress
from src.database.repositories.gameplay import GameplayRepository
from src.services.ai.orchestrator import AgentWorkflowResult, AIOrchestrator
from src.services.gameplay.managers import (
    AchievementEngine,
    BasketLine,
    BasketManager,
    BasketValidationManager,
    CustomerQueueManager,
    MathChallengeManager,
    MissionProgressEngine,
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
        self.basket = BasketManager()
        self.basket_validation = BasketValidationManager()
        self.customers = CustomerQueueManager()
        self.challenges = MathChallengeManager()
        self.scoring = ScoringEngine()
        self.rewards = XpCoinsEngine()
        self.achievements = AchievementEngine()
        self.missions = MissionProgressEngine()
        self.progress_tracker = ProgressTracker()

    async def start_session(self) -> StartGameplaySessionResponse:
        student = await self._demo_student()
        state = self._initial_state()
        game_session = await self.repository.create_session(student.id, state)
        await self.session.commit()
        return StartGameplaySessionResponse(
            session_id=game_session.id,
            student_name=student.display_name,
            started_at=game_session.started_at,
            mission=self._mission(state),
        )

    async def next_customer(self, session_id: UUID) -> NextCustomerResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        if state["current_customer"] is not None:
            raise ApplicationError(
                "Finish the current customer before serving the next one.", status_code=409
            )
        items = await self.repository.list_inventory()
        if not items:
            raise ApplicationError("Shop inventory is unavailable.", status_code=503)
        state["current_customer"] = self.customers.next(int(state["customers_served"]), items)
        advice = await self._agent_advice(game_session, student, state)
        if advice is not None:
            state["current_customer"]["greeting"] = advice.customer.dialogue
            state["recommended_tier"] = advice.difficulty.recommended_tier
            state["agent_mission"] = {
                "title": advice.mission.title,
                "target": advice.mission.target_value,
            }
            state["reward_message"] = advice.reward.celebration_message
            state["learning_insight"] = advice.insight.summary
            if advice.localization.culturally_valid:
                state["current_customer"]["greeting"] = advice.localization.localized_text
        state["basket"] = []
        state["challenge"] = None
        await self._save(game_session, state)
        return NextCustomerResponse(
            customer=CustomerResponse.model_validate(state["current_customer"]),
            basket=await self._basket_response(state),
            mission=self._mission(state),
        )

    async def list_inventory(self, session_id: UUID) -> list[InventoryItemResponse]:
        await self._session_and_student(session_id)
        return [self._item_response(item) for item in await self.repository.list_inventory()]

    async def get_basket(self, session_id: UUID) -> BasketResponse:
        game_session, student = await self._session_and_student(session_id)
        return await self._basket_response(self._state(game_session))

    async def add_basket_item(
        self, session_id: UUID, item_id: UUID, quantity: int
    ) -> BasketResponse:
        game_session, _ = await self._session_and_student(session_id)
        state = self._state(game_session)
        self._require_customer(state)
        item = await self.repository.get_inventory_item(item_id)
        if item is None or not item.is_active:
            raise ApplicationError("Inventory item was not found.", status_code=404)
        lines = self._lines(state)
        try:
            updated = self.basket.add(lines, item_id, quantity, item.stock)
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

    async def request_hint(self, session_id: UUID) -> HintResponse:
        game_session, student = await self._session_and_student(session_id)
        state = self._state(game_session)
        challenge = self._require_challenge(state)
        if bool(challenge["complete"]):
            raise ApplicationError("The challenge is already complete.", status_code=409)
        challenge["hints_used"] = int(challenge["hints_used"]) + 1
        state["hints_used"] = int(state["hints_used"]) + 1
        await self._save(game_session, state)
        advice = await self._agent_advice(game_session, student, state)
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
        state["questions_attempted"] = int(state["questions_attempted"]) + 1
        correct = answer == int(challenge["answer"])
        if correct:
            challenge["complete"] = True
            state["correct_answers"] = int(state["correct_answers"]) + 1
        coins, xp, stars = self.rewards.reward(
            correct, int(challenge["attempts"]), int(challenge["hints_used"])
        )
        state["coins_earned"] = int(state["coins_earned"]) + coins
        state["xp_earned"] = int(state["xp_earned"]) + xp
        state["stars_earned"] = int(state["stars_earned"]) + stars
        await self._update_progress(student, state, coins, xp, stars, correct)
        await self._save(game_session, state)
        reward_message = state.get("reward_message")
        if not isinstance(reward_message, str):
            reward_message = (
                "Your persistence earns rewards!" if correct else "Trying again builds your skills!"
            )
        reward = RewardResponse(
            coins=coins,
            xp=xp,
            stars=stars,
            message=reward_message,
        )
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
        challenge = state["challenge"]
        if not isinstance(challenge, dict):
            recommended_tier = state.get("recommended_tier")
            state["challenge"] = self.challenges.create_checkout_challenge(
                basket.total_kes,
                int(recommended_tier)
                if isinstance(recommended_tier, int)
                else student.difficulty_tier,
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
            item = await self.repository.get_inventory_item(line.item_id)
            if item is None or item.stock < line.quantity:
                raise ApplicationError(
                    "An item is no longer available in the requested quantity.", status_code=409
                )
            item.stock -= line.quantity
        state["customers_served"] = int(state["customers_served"]) + 1
        state["achievements"] = self.achievements.update(
            int(state["customers_served"]),
            True,
            int(challenge["hints_used"]),
            list(state["achievements"]),
        )
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
        progress = await self.repository.get_progress(student.id)
        if progress is None:
            raise ApplicationError("Student progress was not found.", status_code=404)
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
            daily_streak_days=0,
        )

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
        )

    async def _update_progress(
        self,
        student: Student,
        state: dict[str, object],
        coins: int,
        xp: int,
        stars: int,
        correct: bool,
    ) -> None:
        progress = await self.repository.get_progress(student.id)
        if progress is None:
            progress = StudentProgress(student_id=student.id)
            self.session.add(progress)
        progress.questions_attempted += 1
        progress.questions_correct += int(correct)
        progress.hints_used = int(state["hints_used"])
        progress.coins_earned += coins
        progress.xp_earned += xp
        progress.stars_earned += stars
        progress.current_learning_level = student.difficulty_tier

    async def _save(self, game_session: GameSession, state: dict[str, object]) -> None:
        await self.repository.save_game_state(game_session, state)
        await self.session.commit()

    async def _agent_advice(
        self, game_session: GameSession, student: Student, state: dict[str, object]
    ) -> AgentWorkflowResult | None:
        if self.orchestrator is None:
            return None
        basket = await self._basket_response(state)
        context = AgentContext(
            learner=LearnerProfile(
                student_id=student.id,
                age=student.age,
                language=student.language,
                difficulty_tier=student.difficulty_tier,
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
        )
        return await self.orchestrator.run_session_workflow(context)

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
            "agent_mission": None,
            "reward_message": None,
            "learning_insight": None,
        }

    @staticmethod
    def _state(game_session: GameSession) -> dict[str, object]:
        return dict(game_session.game_state or GameplayEngine._initial_state())

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
    def _item_response(item: InventoryItem) -> InventoryItemResponse:
        return InventoryItemResponse(
            id=item.id,
            name=item.name,
            category=item.category,
            price_kes=ShopInventoryManager.price(item),
            image_placeholder=item.image_placeholder,
            stock=item.stock,
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
            amount_paid_kes=int(challenge["amount_paid_kes"]),
        )

    @staticmethod
    def _require_customer(state: dict[str, object]) -> None:
        if state["current_customer"] is None:
            raise ApplicationError("Serve the next customer first.", status_code=409)

    @staticmethod
    def _require_challenge(state: dict[str, object]) -> dict[str, object]:
        challenge = state["challenge"]
        if not isinstance(challenge, dict):
            raise ApplicationError("Start checkout to receive a math challenge.", status_code=409)
        return challenge
