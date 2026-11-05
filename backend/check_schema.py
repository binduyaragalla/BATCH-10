from sqlalchemy import inspect, text
from database import engine

inspector = inspect(engine)

with engine.connect() as connection:

    food_count = connection.execute(
        text("SELECT COUNT(*) FROM foods")
    ).scalar()

    backup_count = connection.execute(
        text("SELECT COUNT(*) FROM foods_backup")
    ).scalar()

print("\n--- MIGRATION VERIFICATION ---")
print("Current food records:", food_count)
print("Backup food records:", backup_count)

print("\nUnique constraints:")
print(inspector.get_unique_constraints("foods"))

if food_count == backup_count:
    print("\nRecord preservation: PASSED")
else:
    print("\nRecord preservation: FAILED")