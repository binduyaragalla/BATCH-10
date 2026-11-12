import pandas as pd
from pathlib import Path

DATA_DIR = Path("../datasets/images/data")

split_labels = {
    "train": set(),
    "validation": set(),
    "test": set()
}

for file in DATA_DIR.glob("*.parquet"):
    split = file.name.split("-")[0]
    df = pd.read_parquet(file)

    split_labels[split].update(df["label"].unique())

all_classes = split_labels["train"]

for split, labels in split_labels.items():
    missing = sorted(all_classes - labels)

    print(f"\n--- {split.upper()} ---")
    print("Available classes:", len(labels))
    print("Missing classes:", len(missing))
    print(missing)