import pandas as pd
import hashlib
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path("../datasets/images/data")

seen = defaultdict(list)

for file in sorted(DATA_DIR.glob("*.parquet")):
    split = file.name.split("-")[0]
    df = pd.read_parquet(file)

    for index, row in df.iterrows():
        image_data = row["image"]
        image_bytes = image_data.get("bytes") if isinstance(image_data, dict) else None

        if not image_bytes:
            continue

        image_hash = hashlib.sha256(image_bytes).hexdigest()

        seen[image_hash].append({
            "split": split,
            "file": file.name,
            "row": index,
            "label": row["label"]
        })

print("\n--- CONFLICTING LABEL DUPLICATES ---")

for image_hash, records in seen.items():
    labels = set(item["label"] for item in records)

    if len(labels) > 1:
        print("\nHash:", image_hash)
        for item in records:
            print(item)

print("\n--- CROSS-SPLIT DUPLICATES ---")

for image_hash, records in seen.items():
    splits = set(item["split"] for item in records)

    if len(records) > 1 and len(splits) > 1:
        print(records)