from sqlalchemy import Column, Integer, String, Float, UniqueConstraint
from database import Base


class Food(Base):
    __tablename__ = "foods"

    __table_args__ = (
        UniqueConstraint(
            "food_name",
            "food_state",
            name="uq_food_name_state"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String, nullable=False)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    unit = Column(String, default="per 100g")
    food_state = Column(String, nullable=False)
    source = Column(String)