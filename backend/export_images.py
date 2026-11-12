import pandas as pd
from pathlib import Path

SOURCE_DIR = Path("../datasets/images/data")
OUTPUT_DIR = Path("../datasets/processed/food_images")

total_exported = 0

for parquet_file in sorted(SOURCE_DIR.glob("*.parquet")):

    split = parquet_file.name.split("-")[0]

    print(f"\nProcessing {split}: {parquet_file.name}")

    df = pd.read_parquet(parquet_file)

    for index, row in df.iterrows():

        label = row["label"]
        image_data = row["image"]

        if not isinstance(image_data, dict):
            continue

        image_bytes = image_data.get("bytes")

        if not image_bytes:
            continue

        class_folder = OUTPUT_DIR / split / label
        class_folder.mkdir(parents=True, exist_ok=True)

        image_path = class_folder / (
            f"{parquet_file.stem}_{index:06d}.jpg"
        )

        image_path.write_bytes(image_bytes)
        total_exported += 1

    print("Completed:", split)

print("\n--- IMAGE EXPORT REPORT ---")
print("Total images exported:", total_exported)
print("Output directory:", OUTPUT_DIR.resolve())