from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import GameSession, Question, QuestionAttempt, Student, StudentProgress


class GameplayRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_demo_student(self) -> Student | None:
        return await self.session.scalar(select(Student).where(Student.is_demo.is_(True)))

    async def create_session(self, student_id: UUID) -> GameSession:
        game_session = GameSession(student_id=student_id)
        self.session.add(game_session)
        await self.session.flush()
        return game_session

    async def get_active_session(self, session_id: UUID) -> GameSession | None:
        return await self.session.scalar(
            select(GameSession).where(GameSession.id == session_id, GameSession.status == "active")
        )

    async def get_next_question(self, session_id: UUID, tier: int) -> Question | None:
        answered_question_ids = select(QuestionAttempt.question_id).where(
            QuestionAttempt.session_id == session_id
        )
        question = await self.session.scalar(
            select(Question)
            .where(
                Question.is_active.is_(True),
                Question.difficulty_tier <= tier,
                Question.id.not_in(answered_question_ids),
            )
            .order_by(Question.difficulty_tier, Question.id)
        )
        return question

    async def get_question(self, question_id: UUID) -> Question | None:
        return await self.session.get(Question, question_id)

    async def has_attempt(self, session_id: UUID, question_id: UUID) -> bool:
        attempt = await self.session.scalar(
            select(QuestionAttempt.id).where(
                QuestionAttempt.session_id == session_id, QuestionAttempt.question_id == question_id
            )
        )
        return attempt is not None

    async def record_attempt(
        self, session_id: UUID, question_id: UUID, submitted_answer: int, is_correct: bool
    ) -> QuestionAttempt:
        attempt = QuestionAttempt(
            session_id=session_id,
            question_id=question_id,
            submitted_answer=submitted_answer,
            is_correct=is_correct,
        )
        self.session.add(attempt)
        await self.session.flush()
        return attempt

    async def get_progress(self, student_id: UUID) -> StudentProgress | None:
        return await self.session.get(StudentProgress, student_id)

    async def increment_progress(self, student_id: UUID, is_correct: bool) -> StudentProgress:
        progress = await self.get_progress(student_id)
        if progress is None:
            progress = StudentProgress(student_id=student_id)
            self.session.add(progress)
        progress.questions_attempted += 1
        if is_correct:
            progress.questions_correct += 1
        await self.session.flush()
        return progress
