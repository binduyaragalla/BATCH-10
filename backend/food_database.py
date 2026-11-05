
from database import SessionLocal
from models import Food


# Get nutrition using food name and preparation state
def get_food_nutrition(food_name, food_state):
    db = SessionLocal()

    try:
        food = db.query(Food).filter(
            Food.food_name.ilike(food_name.strip()),
            Food.food_state.ilike(food_state.strip())
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


# Get unique available food names
def get_all_foods():
    db = SessionLocal()

    try:
        foods = db.query(Food.food_name).distinct().order_by(
            Food.food_name
        ).all()

        return [food[0] for food in foods]

    finally:
        db.close()

# Get available preparation states for a food
def get_food_states(food_name):
    db = SessionLocal()

    try:
        foods = db.query(Food.food_state).filter(
            Food.food_name.ilike(food_name.strip())
        ).distinct().all()

        return [food[0] for food in foods]

    finally:
        db.close()

# Display all food records
def get_food_details():
    db = SessionLocal()

    try:
        foods = db.query(Food).order_by(Food.id).all()

        for food in foods:
            print(
                food.id,
                food.food_name,
                "| State:", food.food_state,
                "| Calories:", food.calories,
                "| Source:", food.source
            )

    finally:
        db.close()


# Check raw and cooked food records
def check_food_states(food_name):
    db = SessionLocal()

    try:
        foods = db.query(Food).filter(
            Food.food_name.ilike(food_name.strip())
        ).all()

        for food in foods:
            print(
                food.food_name,
                "| State:", food.food_state,
                "| Calories:", food.calories
            )

    finally:
        db.close()


if __name__ == "__main__":
    get_food_details()
    print("\n--- RICE PREPARATION STATES ---")
    check_food_states("Rice")
