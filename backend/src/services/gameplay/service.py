from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.contracts.demo import (
    AnswerQuestionResponse,
    DemoStudentResponse,
    NextQuestionResponse,
    ProgressResponse,
    QuestionResponse,
    StartSessionResponse,
)
from src.core.exceptions import ApplicationError
from src.database.models import Student, StudentProgress
from src.database.repositories.gameplay import GameplayRepository


class GameplayService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = GameplayRepository(session)

    async def start_demo_session(self) -> StartSessionResponse:
        student = await self._get_demo_student()
        game_session = await self.repository.create_session(student.id)
        await self.session.commit()
        return StartSessionResponse(
            session_id=game_session.id,
            student=self._student_response(student),
            started_at=game_session.started_at,
        )

    async def get_next_question(self, session_id: UUID) -> NextQuestionResponse:
        game_session = await self._get_active_session(session_id)
        student = await self.session.get(Student, game_session.student_id)
        if student is None:
            raise ApplicationError("Student was not found.", status_code=404)
        question = await self.repository.get_next_question(session_id, student.difficulty_tier)
        if question is None:
            return NextQuestionResponse(question=None)
        return NextQuestionResponse(
            question=QuestionResponse(
                id=question.id,
                prompt=question.prompt,
                skill=question.skill,
                difficulty_tier=question.difficulty_tier,
            )
        )

    async def answer_question(
        self, session_id: UUID, question_id: UUID, answer: int
    ) -> AnswerQuestionResponse:
        game_session = await self._get_active_session(session_id)
        question = await self.repository.get_question(question_id)
        if question is None:
            raise ApplicationError("Question was not found.", status_code=404)
        if await self.repository.has_attempt(session_id, question_id):
            raise ApplicationError("This question has already been answered.", status_code=409)

        is_correct = answer == question.correct_answer
        await self.repository.record_attempt(session_id, question_id, answer, is_correct)
        progress = await self.repository.increment_progress(game_session.student_id, is_correct)
        await self.session.commit()
        student = await self.session.get(Student, game_session.student_id)
        if student is None:
            raise ApplicationError("Student was not found.", status_code=404)
        return AnswerQuestionResponse(
            is_correct=is_correct,
            progress=self._progress_response(student, progress),
        )

    async def get_demo_progress(self) -> ProgressResponse:
        student = await self._get_demo_student()
        progress = await self.repository.get_progress(student.id)
        if progress is None:
            raise ApplicationError("Student progress was not found.", status_code=404)
        return self._progress_response(student, progress)

    async def _get_demo_student(self) -> Student:
        student = await self.repository.get_demo_student()
        if student is None:
            raise ApplicationError("Demo profile is not available.", status_code=503)
        return student

    async def _get_active_session(self, session_id: UUID):
        game_session = await self.repository.get_active_session(session_id)
        if game_session is None:
            raise ApplicationError("Active session was not found.", status_code=404)
        return game_session

    @staticmethod
    def _student_response(student: Student) -> DemoStudentResponse:
        return DemoStudentResponse(
            id=student.id,
            display_name=student.display_name,
            language=student.language,
            difficulty_tier=student.difficulty_tier,
        )

    def _progress_response(self, student: Student, progress: StudentProgress) -> ProgressResponse:
        accuracy = 0.0
        if progress.questions_attempted:
            accuracy = round(progress.questions_correct / progress.questions_attempted * 100, 1)
        return ProgressResponse(
            student=self._student_response(student),
            questions_attempted=progress.questions_attempted,
            questions_correct=progress.questions_correct,
            accuracy_percent=accuracy,
        )
