import pandas as pd
from PIL import Image
from io import BytesIO
from pathlib import Path

file_path = Path("../datasets/images/data/test-00000-of-00001.parquet")

df = pd.read_parquet(file_path)

sample = df.iloc[0]
image_data = sample["image"]

print("Food label:", sample["label"])
print("Image data type:", type(image_data))

if isinstance(image_data, dict):
    print("Image keys:", image_data.keys())

    image_bytes = image_data.get("bytes")

    if image_bytes:
        image = Image.open(BytesIO(image_bytes))
        print("Image format:", image.format)
        print("Image dimensions:", image.size)
        print("Image mode:", image.mode)
    else:
        print("Image bytes not available in this record.")
else:
    print("Unexpected image data format.")