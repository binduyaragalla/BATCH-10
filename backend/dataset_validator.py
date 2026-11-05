import pandas as pd


def validate_dataset(file_path):

    df = pd.read_csv(file_path)

    required_columns = [
        "food_name", "calories", "protein",
        "carbs", "fat", "food_state", "source"
    ]

    print("\n--- DATASET QUALITY REPORT ---")

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    print("Missing columns:", missing_columns)

    if missing_columns:
        print("Dataset validation failed!")
        return

    print("Missing values:", df.isnull().sum().sum())
    print("Duplicate rows:", df.duplicated().sum())

    # Check empty food names
    empty_names = (
        df["food_name"].fillna("").astype(str).str.strip() == ""
    )
    print("Empty food names:", empty_names.sum())

    # Check duplicate food names
    duplicate_names = (
        df["food_name"].fillna("").astype(str)
        .str.strip().str.lower().duplicated()
    )
    print("Duplicate food names:", duplicate_names.sum())

    # Check numeric nutrition values
    nutrition = df[["calories", "protein", "carbs", "fat"]]

    nutrition = nutrition.apply(pd.to_numeric, errors="coerce")

    invalid_values = nutrition.isna().any(axis=1) | (nutrition < 0).any(axis=1)

    print("Invalid nutrition records:", invalid_values.sum())

    # Check food state
    valid_states = ["raw", "cooked", "processed"]

    invalid_states = ~(
        df["food_state"].fillna("").astype(str)
        .str.strip().str.lower().isin(valid_states)
    )

    print("Invalid food states:", invalid_states.sum())

    if (
        not missing_columns
        and not invalid_values.any()
        and not invalid_states.any()
        and not empty_names.any()
        and not duplicate_names.any()
    ):
        print("\nDataset quality checks passed!")
    else:
        print("\nDataset needs correction!")


if __name__ == "__main__":
    validate_dataset(
        "../datasets/processed/food_nutrition_cleaned.csv"
    )