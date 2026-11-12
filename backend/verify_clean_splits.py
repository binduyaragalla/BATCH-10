from pathlib import Path

DATA_DIR = Path("../datasets/processed/food_images_clean")

splits = ["train", "validation", "test"]
split_hashes = {}

print("\n--- FINAL DATASET VERIFICATION ---")

for split in splits:
    split_dir = DATA_DIR / split
    images = list(split_dir.rglob("*.jpg"))
    classes = [p for p in split_dir.iterdir() if p.is_dir()]

    split_hashes[split] = {image.stem for image in images}

    print(f"\n{split.upper()}")
    print("Images:", len(images))
    print("Classes:", len(classes))

    missing = [
        food_class for food_class in
        (p.name for p in (DATA_DIR / "train").iterdir() if p.is_dir())
        if not (split_dir / food_class).exists()
        or not list((split_dir / food_class).glob("*.jpg"))
    ]

    print("Missing classes:", missing)

print("\n--- CROSS-SPLIT DUPLICATE CHECK ---")

for i, first in enumerate(splits):
    for second in splits[i + 1:]:
        overlap = split_hashes[first] & split_hashes[second]
        print(f"{first} vs {second}: {len(overlap)} duplicates")

print("\nVerification completed.")