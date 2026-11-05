
import pandas as pd

from database import SessionLocal
from models import Food


def import_dataset(file_path):
    df = pd.read_csv(file_path)

    required_columns = [
        "food_name", "calories", "protein",
        "carbs", "fat", "food_state", "source"
    ]

    if not all(col in df.columns for col in required_columns):
        print("Import failed: Required columns are missing!")
        return

    db = SessionLocal()

    imported = 0
    updated = 0
    skipped = 0

    try:
        for _, row in df.iterrows():

            name = str(row["food_name"]).strip()

            if not name or name.lower() == "nan":
                skipped += 1
                continue

            values = [
                pd.to_numeric(row[col], errors="coerce")
                for col in ["calories", "protein", "carbs", "fat"]
            ]

            if any(pd.isna(v) or v < 0 for v in values):
                skipped += 1
                continue

            state = str(row["food_state"]).strip().lower()

            food = db.query(Food).filter(
                Food.food_name.ilike(name),
                Food.food_state.ilike(state)
            ).first()

            if food is None:
                food = Food(food_name=name)
                db.add(food)
                imported += 1
                print("INSERTED:", name)
            else:
                updated += 1
                print("UPDATED:", name)

            food.calories = float(values[0])
            food.protein = float(values[1])
            food.carbs = float(values[2])
            food.fat = float(values[3])
            food.food_state = state
            food.source = str(row["source"]).strip()
            food.unit = "per 100g"

        db.commit()

        print("\n--- DATASET IMPORT REPORT ---")
        print("New records:", imported)
        print("Updated records:", updated)
        print("Skipped records:", skipped)
        print("Dataset import completed!")

    except Exception as error:
        db.rollback()
        print("Import failed:", error)

    finally:
        db.close()


if __name__ == "__main__":
    import_dataset(
        "../datasets/processed/food_nutrition_cleaned.csv"
    )
