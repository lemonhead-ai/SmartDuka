from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import InventoryItem, Question, Student, StudentProgress


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
    inventory_exists = await session.scalar(select(InventoryItem.id).limit(1))
    if inventory_exists is None:
        session.add_all(
            [
                InventoryItem(
                    name="Banana",
                    category="fruits",
                    base_price_kes=10,
                    image_placeholder="banana",
                    stock=40,
                    educational_tags=["counting", "addition"],
                ),
                InventoryItem(
                    name="Mango",
                    category="fruits",
                    base_price_kes=25,
                    image_placeholder="mango",
                    stock=25,
                    educational_tags=["money", "addition"],
                ),
                InventoryItem(
                    name="Tomato",
                    category="vegetables",
                    base_price_kes=8,
                    image_placeholder="tomato",
                    stock=50,
                    educational_tags=["counting"],
                ),
                InventoryItem(
                    name="Milk",
                    category="drinks",
                    base_price_kes=60,
                    image_placeholder="milk",
                    stock=20,
                    educational_tags=["money", "change"],
                ),
                InventoryItem(
                    name="Juice",
                    category="drinks",
                    base_price_kes=45,
                    image_placeholder="juice",
                    stock=20,
                    educational_tags=["addition"],
                ),
                InventoryItem(
                    name="Mandazi",
                    category="snacks",
                    base_price_kes=10,
                    image_placeholder="mandazi",
                    stock=60,
                    educational_tags=["multiplication"],
                ),
                InventoryItem(
                    name="Exercise Book",
                    category="school_supplies",
                    base_price_kes=35,
                    image_placeholder="exercise-book",
                    stock=30,
                    educational_tags=["money"],
                ),
                InventoryItem(
                    name="Soap",
                    category="household_items",
                    base_price_kes=55,
                    image_placeholder="soap",
                    stock=25,
                    educational_tags=["subtraction", "change"],
                ),
            ]
        )
    await session.commit()
