
import os
import torch
import torch.nn as nn
import torch.nn.functional as F

from torchvision import models, transforms
from PIL import Image, ImageOps


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "nutrivision_mobilenetv2_baseline.pth"
)

DEVICE = torch.device("cpu")

# Same preprocessing used during model evaluation
transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def load_model():

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )

    class_names = checkpoint["classes"]

    model = models.mobilenet_v2(weights=None)

    model.classifier[1] = nn.Linear(
        model.last_channel,
        len(class_names)
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.to(DEVICE)
    model.eval()

    return model, class_names


model, class_names = load_model()


def predict_food(image):

    image = ImageOps.exif_transpose(image)
    image = image.convert("RGB")

    image_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():

        outputs = model(image_tensor)

        probabilities = F.softmax(outputs, dim=1)

        top_probabilities, top_indices = torch.topk(
            probabilities,
            k=3,
            dim=1
        )

    predictions = []

    for probability, index in zip(
        top_probabilities[0],
        top_indices[0]
    ):

        predictions.append({
            "food_name": class_names[index.item()],
            "confidence": round(
                probability.item() * 100, 2
            )
        })

    return {
        "predicted_food": predictions[0]["food_name"],
        "confidence": predictions[0]["confidence"],
        "top_predictions": predictions
    }


print("NutriVision AI model loaded successfully!")
print("Device:", DEVICE)
print("Food classes:", len(class_names))
