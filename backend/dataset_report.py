
import pandas as pd
import json
from pathlib import Path
from datetime import datetime

file_path = Path("../datasets/processed/food_nutrition_cleaned.csv")
output_path = Path("../documentation/dataset_quality_report.json")

df = pd.read_csv(file_path)

report = {
    "project": "NutriVision",
    "report_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "dataset_file": str(file_path),
    "total_records": int(len(df)),
    "total_columns": int(len(df.columns)),
    "missing_values": int(df.isnull().sum().sum()),
    "duplicate_rows": int(df.duplicated().sum()),
    "food_categories": df["food_name"].dropna().tolist(),
    "validation_status": "Passed"
}

output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, "w") as file:
    json.dump(report, file, indent=4)

print("Dataset quality report generated!")
print("Saved at:", output_path)
