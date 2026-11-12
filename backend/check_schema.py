from sqlalchemy import inspect, text
from database import engine

inspector = inspect(engine)

with engine.connect() as connection:

    current_records = connection.execute(
        text("""
            SELECT food_name, food_state
            FROM foods
            ORDER BY food_name, food_state
        """)
    ).fetchall()

    backup_records = connection.execute(
        text("""
            SELECT food_name, food_state
            FROM foods_backup
            ORDER BY food_name, food_state
        """)
    ).fetchall()

current_set = set(current_records)
backup_set = set(backup_records)

missing_records = backup_set - current_set
additional_records = current_set - backup_set

print("\n--- MIGRATION VERIFICATION ---")
print("Current food records:", len(current_records))
print("Backup food records:", len(backup_records))

print("\nUnique constraints:")
print(inspector.get_unique_constraints("foods"))

print("\nMissing original records:", missing_records)
print("Additional records:", additional_records)

if not missing_records:
    print("\nOriginal record preservation: PASSED")
else:
    print("\nOriginal record preservation: FAILED")