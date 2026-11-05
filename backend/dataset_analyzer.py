import pandas as pd
from pathlib import Path


def analyze_dataset(file_path):

    path = Path(file_path)

    if not path.exists():
        print("Dataset file not found!")
        return

    df = pd.read_csv(path)

    print("\n--- DATASET ANALYSIS ---")
    print("Rows:", df.shape[0])
    print("Columns:", df.shape[1])

    print("\nColumn Names:")
    print(df.columns.tolist())

    print("\nMissing Values:")
    print(df.isnull().sum())

    print("\nDuplicate Rows:", df.duplicated().sum())

    print("\nData Types:")
    print(df.dtypes)

    print("\nDataset Preview:")
    print(df.head())


if __name__ == "__main__":
    analyze_dataset("../datasets/raw/food_nutrition.csv")