import torch
from torchvision import models

print("Loading MobileNetV2...")

weights = models.MobileNet_V2_Weights.DEFAULT

model = models.mobilenet_v2(weights=weights)

# Replace final layer for 43 food classes
model.classifier[1] = torch.nn.Linear(
    model.last_channel,
    43
)

model.eval()

print("\nModel loaded successfully!")
print("Architecture: MobileNetV2")
print("Output classes:", model.classifier[1].out_features)

# Test with one sample image
dummy_input = torch.randn(1, 3, 224, 224)

with torch.no_grad():
    output = model(dummy_input)

print("Output shape:", output.shape)