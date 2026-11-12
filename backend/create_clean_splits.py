import pandas as pd
import hashlib
from pathlib import Path
from collections import defaultdict
from sklearn.model_selection import train_test_split

SOURCE_DIR = Path("../datasets/images/data")
OUTPUT_DIR = Path("../datasets/processed/food_images_clean")

# PASS 1: Identify unique images and conflicting labels
records = []
hash_labels = defaultdict(set)

for file in sorted(SOURCE_DIR.glob("*.parquet")):
    df = pd.read_parquet(file)

    for index, row in df.iterrows():
        image_data = row["image"]
        image_bytes = image_data.get("bytes") if isinstance(image_data, dict) else None

        if not image_bytes:
            continue

        image_hash = hashlib.sha256(image_bytes).hexdigest()
        label = row["label"]

        records.append({
            "file": file.name,
            "row": index,
            "label": label,
            "hash": image_hash
        })

        hash_labels[image_hash].add(label)

# Exclude ambiguous labels and duplicate image records
seen = set()
unique_records = []

for record in records:
    image_hash = record["hash"]

    if len(hash_labels[image_hash]) > 1:
        continue

    if image_hash in seen:
        continue

    seen.add(image_hash)
    unique_records.append(record)

data = pd.DataFrame(unique_records)

print("Unique valid images:", len(data))
print("Food classes:", data["label"].nunique())

# PASS 2: Stratified split for every class
split_map = {}

for label, group in data.groupby("label"):
    hashes = group["hash"].tolist()

    train_hashes, remaining = train_test_split(
        hashes,
        test_size=0.30,
        random_state=42
    )

    val_hashes, test_hashes = train_test_split(
        remaining,
        test_size=0.50,
        random_state=42
    )

    for image_hash in train_hashes:
        split_map[image_hash] = "train"

    for image_hash in val_hashes:
        split_map[image_hash] = "validation"

    for image_hash in test_hashes:
        split_map[image_hash] = "test"

# PASS 3: Export images into new folders
for file in sorted(SOURCE_DIR.glob("*.parquet")):
    df = pd.read_parquet(file)

    for index, row in df.iterrows():
        image_data = row["image"]
        image_bytes = image_data.get("bytes") if isinstance(image_data, dict) else None

        if not image_bytes:
            continue

        image_hash = hashlib.sha256(image_bytes).hexdigest()

        if image_hash not in split_map:
            continue

        label = row["label"]
        split = split_map[image_hash]

        output_folder = OUTPUT_DIR / split / label
        output_folder.mkdir(parents=True, exist_ok=True)

        output_path = output_folder / f"{image_hash}.jpg"

        if not output_path.exists():
            output_path.write_bytes(image_bytes)

# PASS 4: Report
print("\n--- CLEAN DATASET REPORT ---")

for split in ["train", "validation", "test"]:
    split_data = data[
        data["hash"].map(split_map) == split
    ]

    print(f"\n{split.upper()}")
    print("Images:", len(split_data))
    print("Classes:", split_data["label"].nunique())

print("\nClean dataset created at:", OUTPUT_DIR.resolve())