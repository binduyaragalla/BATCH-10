
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    UniqueConstraint,
    Boolean,
    DateTime,
    Date,
    ForeignKey
)
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


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


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    filename = Column(String, nullable=False)
    predicted_food = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    food_state = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    nutrition_available = Column(Integer, default=0)
    created_at = Column(String, nullable=False)


class FitnessWorkout(Base):
    __tablename__ = "fitness_workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    activity = Column(String(100), nullable=False)
    duration = Column(Float, nullable=False)
    calories_burned = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WaterIntake(Base):
    __tablename__ = "water_intake"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "intake_date",
            name="uq_user_water_date"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    intake_date = Column(Date, nullable=False)
    glasses = Column(Integer, default=0, nullable=False)
    daily_goal = Column(Integer, default=8, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
