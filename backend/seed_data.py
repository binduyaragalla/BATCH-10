from database import SessionLocal, engine, Base
from models import Food

from add_foods import add_food_records

Base.metadata.create_all(bind=engine)

add_food_records()

print("NutriVision database initialized successfully!")
