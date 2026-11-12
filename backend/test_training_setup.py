import torch
from torchvision import datasets, transforms
from pathlib import Path

DATA_DIR = Path("../datasets/processed/food_images_clean/train")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

dataset = datasets.ImageFolder(
    root=DATA_DIR,
    transform=transform
)

print("Classes:", len(dataset.classes))
print("Total images:", len(dataset))

image, label = dataset[0]

print("Image shape:", image.shape)
print("Label:", dataset.classes[label])
print("PyTorch CPU test:", torch.rand(2, 2))