import pandas as pd
import hashlib
from pathlib import Path
from collections import Counter

DATA_DIR = Path("../datasets/images/data")

seen_images = {}
class_counts = Counter()
duplicates = 0
conflicting_labels = 0
total = 0

for file in sorted(DATA_DIR.glob("*.parquet")):
    df = pd.read_parquet(file)

    for _, row in df.iterrows():
        image_data = row["image"]
        label = row["label"]

        if not isinstance(image_data, dict):
            continue

        image_bytes = image_data.get("bytes")

        if not image_bytes:
            continue

        image_hash = hashlib.sha256(image_bytes).hexdigest()
        total += 1
        class_counts[label] += 1

        if image_hash in seen_images:
            duplicates += 1

            if seen_images[image_hash] != label:
                conflicting_labels += 1
        else:
            seen_images[image_hash] = label

print("\n--- DUPLICATE IMAGE AUDIT ---")
print("Total images:", total)
print("Unique images:", len(seen_images))
print("Duplicate occurrences:", duplicates)
print("Conflicting-label duplicates:", conflicting_labels)
print("Food classes:", len(class_counts))