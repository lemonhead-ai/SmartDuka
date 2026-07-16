from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import Question, Student, StudentProgress


async def seed_demo_data(session: AsyncSession) -> None:
    student = await session.scalar(select(Student).where(Student.is_demo.is_(True)))
    if student is None:
        student = Student(
            display_name="Amina",
            age=9,
            language="sw",
            difficulty_tier=2,
            is_demo=True,
        )
        session.add(student)
        await session.flush()
        session.add(StudentProgress(student_id=student.id))

    question_count = await session.scalar(select(Question.id).limit(1))
    if question_count is None:
        session.add_all(
            [
                Question(
                    prompt="Unga costs KES 40 and chai costs KES 20. What is the total?",
                    correct_answer=60,
                    skill="addition",
                    difficulty_tier=2,
                ),
                Question(
                    prompt=(
                        "A customer gives KES 100 for items costing KES 65. "
                        "What change do they get?"
                    ),
                    correct_answer=35,
                    skill="change",
                    difficulty_tier=2,
                ),
                Question(
                    prompt="Three mandazi cost KES 10 each. What is the total price?",
                    correct_answer=30,
                    skill="multiplication",
                    difficulty_tier=3,
                ),
            ]
        )
    await session.commit()
