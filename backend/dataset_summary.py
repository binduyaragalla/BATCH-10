from pathlib import Path
import pandas as pd

REPORT_PATH = Path(
    "../datasets/statistics/clean_dataset_class_distribution.csv"
)

df = pd.read_csv(REPORT_PATH)

print("\n--- CLEAN DATASET SUMMARY ---")

for split in ["train", "validation", "test"]:
    data = df[df["split"] == split]

    print(f"\n{split.upper()}")
    print("Total images:", data["image_count"].sum())
    print("Food classes:", data["food_class"].nunique())
    print("Average images per class:", round(data["image_count"].mean(), 2))
    print("Minimum images:", data["image_count"].min())
    print("Maximum images:", data["image_count"].max())

print("\nDataset summary completed.")