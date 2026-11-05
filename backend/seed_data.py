from database import SessionLocal, engine, Base
from models import Food

Base.metadata.create_all(bind=engine)

db = SessionLocal()

foods = [
    Food(food_name="Cooked White Rice", calories=130, protein=2.7, carbs=28, fat=0.3, unit="per 100g", food_state="cooked", source="Provisional test data"),
    Food(food_name="Idli", calories=146, protein=4.5, carbs=30, fat=0.7, unit="per 100g", food_state="cooked", source="Provisional test data"),
    Food(food_name="Plain Dosa", calories=168, protein=4, carbs=28, fat=4, unit="per 100g", food_state="cooked", source="Provisional test data"),
    Food(food_name="Banana", calories=89, protein=1.1, carbs=22.8, fat=0.3, unit="per 100g", food_state="raw", source="Provisional test data"),
    Food(food_name="Chapati", calories=297, protein=9.6, carbs=46, fat=7.5, unit="per 100g", food_state="cooked", source="Provisional test data")
]

for food in foods:
    existing = db.query(Food).filter(
        Food.food_name == food.food_name
    ).first()

    if not existing:
        db.add(food)

db.commit()
db.close()

print("5 food records inserted successfully!")