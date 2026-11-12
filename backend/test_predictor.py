
import os
import glob

from PIL import Image
from predictor import predict_food

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEST_DIR = os.path.join(
    BASE_DIR,
    "..",
    "datasets",
    "processed",
    "food_images_clean",
    "test"
)

image_files = glob.glob(
    os.path.join(TEST_DIR, "*", "*.jpg")
)

if not image_files:
    raise FileNotFoundError(
        "No test images found. Check the dataset path."
    )

image_path = image_files[0]

image = Image.open(image_path)

print("Testing image:", image_path)

result = predict_food(image)

print("\nNUTRIVISION PREDICTION")
print("----------------------")
print("Predicted food:", result["predicted_food"])
print("Confidence:", result["confidence"], "%")

print("\nTop 3 predictions:")

for item in result["top_predictions"]:
    print(
        item["food_name"],
        "-",
        item["confidence"],
        "%"
    )
