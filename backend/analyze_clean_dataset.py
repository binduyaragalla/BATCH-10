from pathlib import Path
from collections import Counter
import csv

DATA_DIR = Path("../datasets/processed/food_images_clean")
OUTPUT_DIR = Path("../datasets/statistics")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

rows = []

for split in ["train", "validation", "test"]:
    split_dir = DATA_DIR / split

    counts = {
        folder.name: len(list(folder.glob("*.jpg")))
        for folder in split_dir.iterdir()
        if folder.is_dir()
    }

    values = list(counts.values())

    print(f"\n--- {split.upper()} ---")
    print("Total images:", sum(values))
    print("Food classes:", len(counts))
    print("Minimum images in a class:", min(values))
    print("Maximum images in a class:", max(values))

    for food, count in sorted(counts.items()):
        rows.append({
            "split": split,
            "food_class": food,
            "image_count": count
        })

output_file = OUTPUT_DIR / "clean_dataset_class_distribution.csv"

with open(output_file, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["split", "food_class", "image_count"]
    )
    writer.writeheader()
    writer.writerows(rows)

print("\nClass distribution report saved:", output_file)
