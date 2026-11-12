IMAGE_SIZE = 224

BATCH_SIZE = 16

NUM_CLASSES = 43

EPOCHS = 10

LEARNING_RATE = 0.001

MODEL_NAME = "MobileNetV2"

DATASET_PATH = "../datasets/processed/food_images_clean"

TRAIN_DIR = f"{DATASET_PATH}/train"

VALIDATION_DIR = f"{DATASET_PATH}/validation"

TEST_DIR = f"{DATASET_PATH}/test"

DEVICE = "cuda"