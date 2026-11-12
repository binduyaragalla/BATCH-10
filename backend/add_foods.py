
from database import SessionLocal
from models import Food

# Approximate nutrition values per 100g of prepared food.
# These are reference estimates, not laboratory-verified values.

FOODS = [
    ("Aloo Gobi", 110, 3.0, 14.0, 5.0),
    ("Aloo Masala", 130, 2.5, 18.0, 5.5),
    ("Bhindi Masala", 100, 2.5, 10.0, 5.0),
    ("Biryani", 180, 5.0, 25.0, 7.0),
    ("Burger", 295, 15.0, 30.0, 12.0),
    ("Butter Naan", 310, 8.0, 48.0, 9.0),
    ("Chai", 50, 2.0, 6.0, 2.0),
    ("Chapati", 120, 3.5, 20.0, 3.0),
    ("Chicken Curry", 160, 15.0, 5.0, 9.0),
    ("Chole", 165, 8.0, 22.0, 5.0),
    ("Chole Bhature", 290, 8.0, 35.0, 13.0),
    ("Coconut Chutney", 220, 3.0, 10.0, 19.0),
    ("Dal Makhani", 180, 7.0, 17.0, 9.0),
    ("Dhokla", 160, 6.0, 25.0, 4.0),
    ("Dum Aloo", 150, 3.0, 18.0, 7.0),
    ("Fish Curry", 140, 16.0, 4.0, 7.0),
    ("Fried Rice", 170, 4.0, 28.0, 5.0),
    ("Ghevar", 400, 6.0, 55.0, 18.0),
    ("Green Chutney", 80, 3.0, 10.0, 3.0),
    ("Gulab Jamun", 350, 5.0, 55.0, 12.0),
    ("Idli", 146, 4.5, 30.0, 0.7),
    ("Jalebi", 400, 3.0, 65.0, 15.0),
    ("Kathi Rolls", 220, 9.0, 25.0, 9.0),
    ("Kadai Paneer", 190, 10.0, 8.0, 13.0),
    ("Kebab", 200, 18.0, 5.0, 12.0),
    ("Kheer", 150, 4.0, 24.0, 4.0),
    ("Kulfi", 220, 5.0, 28.0, 10.0),
    ("Lassi", 90, 3.5, 12.0, 3.0),
    ("Masala Dosa", 165, 4.0, 25.0, 5.0),
    ("Modak", 250, 5.0, 40.0, 8.0),
    ("Momos", 180, 7.0, 25.0, 6.0),
    ("Mutton Curry", 200, 17.0, 5.0, 13.0),
    ("Pani Puri", 180, 4.0, 28.0, 6.0),
    ("Pakode", 280, 6.0, 30.0, 15.0),
    ("Palak Paneer", 160, 9.0, 8.0, 10.0),
    ("Pav Bhaji", 170, 4.0, 25.0, 6.0),
    ("Pizza", 266, 11.0, 33.0, 10.0),
    ("Poha", 130, 2.5, 25.0, 3.0),
    ("Rajma Curry", 140, 8.0, 20.0, 3.0),
    ("Ras Malai", 250, 7.0, 35.0, 9.0),
    ("Samosa", 300, 6.0, 32.0, 17.0),
    ("Shahi Paneer", 220, 10.0, 8.0, 17.0),
    ("Cooked White Rice", 130, 2.7, 28.0, 0.3),
]

def add_food_records():
    db = SessionLocal()
    added = 0
    skipped = 0

    try:
        for name, calories, protein, carbs, fat in FOODS:
            existing = db.query(Food).filter(
                Food.food_name.ilike(name),
                Food.food_state.ilike("cooked")
            ).first()

            if existing:
                skipped += 1
                continue

            db.add(Food(
                food_name=name,
                calories=calories,
                protein=protein,
                carbs=carbs,
                fat=fat,
                unit="per 100g",
                food_state="cooked",
                source="Approximate reference values"
            ))
            added += 1

        db.commit()

        print("Food database update completed!")
        print("Records added:", added)
        print("Existing records skipped:", skipped)

    except Exception as error:
        db.rollback()
        print("Database update failed:", error)

    finally:
        db.close()


if __name__ == "__main__":
    add_food_records()
