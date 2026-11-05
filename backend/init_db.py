from database import Base, engine
from models import Food

Base.metadata.create_all(bind=engine)

print("NutriVision database and tables created successfully!")