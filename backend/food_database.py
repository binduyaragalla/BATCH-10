from database import SessionLocal
from models import Food


def get_food_nutrition(food_name):
    db = SessionLocal()

    try:
        food = db.query(Food).filter(
            Food.food_name.ilike(food_name.strip())
        ).first()

        if food is None:
            return None

        return {
            "food_name": food.food_name,
            "calories": food.calories,
            "protein": food.protein,
            "carbs": food.carbs,
            "fat": food.fat,
            "unit": food.unit,
            "food_state": food.food_state,
            "source": food.source
        }

    finally:
        db.close()


def get_all_foods():
    db = SessionLocal()

    try:
        foods = db.query(Food).all()
        return [food.food_name for food in foods]

    finally:
        db.close()