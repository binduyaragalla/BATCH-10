import pandas as pd
from pathlib import Path

DATA_DIR = Path("../datasets/images/data")

all_labels = []

for file in DATA_DIR.glob("*.parquet"):
    df = pd.read_parquet(file)
    all_labels.extend(df["label"].tolist())

labels = pd.Series(all_labels)

print("\n--- FOOD CLASS DISTRIBUTION ---")
print("Total images:", len(labels))
print("Unique food classes:", labels.nunique())

print("\nFood classes:")
print(sorted(labels.unique()))

print("\nImages per class:")
print(labels.value_counts().sort_index())