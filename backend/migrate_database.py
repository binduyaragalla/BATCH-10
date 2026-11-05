
from sqlalchemy import text
from database import engine

with engine.begin() as connection:

    # Preserve existing records
    connection.execute(text("""
        CREATE TABLE foods_backup AS
        SELECT * FROM foods
    """))

    # Create new table with updated constraint
    connection.execute(text("""
        CREATE TABLE foods_new (
            id INTEGER PRIMARY KEY,
            food_name VARCHAR NOT NULL,
            calories FLOAT NOT NULL,
            protein FLOAT NOT NULL,
            carbs FLOAT NOT NULL,
            fat FLOAT NOT NULL,
            unit VARCHAR DEFAULT 'per 100g',
            food_state VARCHAR NOT NULL,
            source VARCHAR,
            CONSTRAINT uq_food_name_state
            UNIQUE (food_name, food_state)
        )
    """))

    # Copy existing records
    connection.execute(text("""
        INSERT INTO foods_new
        SELECT * FROM foods
    """))

    # Replace old table
    connection.execute(text("DROP TABLE foods"))

    connection.execute(text("""
        ALTER TABLE foods_new RENAME TO foods
    """))

    # Restore ID index
    connection.execute(text("""
        CREATE INDEX ix_foods_id ON foods (id)
    """))

print("Database migration completed!")
print("Backup preserved in foods_backup.")
