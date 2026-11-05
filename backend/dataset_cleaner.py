import pandas as pd
from pathlib import Path


def clean_dataset(input_file, output_file):

    df = pd.read_csv(input_file)

    original_rows = len(df)

    # Remove extra spaces
    for column in df.select_dtypes(include="str").columns:
        df[column] = df[column].str.strip()

    # Standardize food state
    df["food_state"] = df["food_state"].str.lower()

    # Convert nutrition columns to numeric
    numeric_columns = ["calories", "protein", "carbs", "fat"]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column], errors="coerce"
        )

    # Remove records without essential information
    df = df.dropna(subset=["food_name", "calories"])

    # Remove duplicate records
    df = df.drop_duplicates()

    # Save cleaned dataset
    Path(output_file).parent.mkdir(
        parents=True, exist_ok=True
    )

    df.to_csv(output_file, index=False)

    print("Dataset cleaning completed!")
    print("Original records:", original_rows)
    print("Cleaned records:", len(df))
    print("Removed records:", original_rows - len(df))
    print("Saved to:", output_file)


if __name__ == "__main__":
    clean_dataset(
        "../datasets/raw/food_nutrition.csv",
        "../datasets/processed/food_nutrition_cleaned.csv"
    )