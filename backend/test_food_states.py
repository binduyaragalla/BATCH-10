from database import SessionLocal
from models import Food

db = SessionLocal()

try:
    raw_rice = db.query(Food).filter(
        Food.food_name.ilike("Rice"),
        Food.food_state.ilike("raw")
    ).first()

    if raw_rice is None:
        raw_rice = Food(
            food_name="Rice",
            calories=365,
            protein=7.1,
            carbs=80,
            fat=0.7,
            unit="per 100g",
            food_state="raw",
            source="Illustrative test data"
        )

        db.add(raw_rice)
        db.commit()
        print("Raw Rice inserted successfully!")

    else:
        print("Raw Rice already exists.")

finally:
    db.close()