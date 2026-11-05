
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from nutrition_engine import calculate_nutrition
from food_database import (
    get_food_nutrition,
    get_all_foods,
    get_food_states
)


app = FastAPI(
    title="NutriVision API",
    description="AI-Based Food Detection and Personalized Nutrition Analysis",
    version="1.0.0"
)


class NutritionRequest(BaseModel):
    food_name: str
    food_state: str
    quantity: float = Field(gt=0)


@app.get("/")
def home():
    return {"message": "Welcome to NutriVision!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/foods")
def list_foods():
    return {"available_foods": get_all_foods()}


@app.get("/foods/{food_name}/states")
def list_food_states(food_name: str):
    states = get_food_states(food_name)

    if not states:
        raise HTTPException(
            status_code=404,
            detail="Food not found"
        )

    return {
        "food_name": food_name,
        "available_states": states
    }


@app.post("/nutrition/from-database")
def nutrition_from_database(data: NutritionRequest):

    nutrition = get_food_nutrition(
        data.food_name,
        data.food_state
    )

    if nutrition is None:
        raise HTTPException(
            status_code=404,
            detail="Food not found for the selected preparation state"
        )

    result = calculate_nutrition(
        nutrition["food_name"],
        data.quantity,
        nutrition["calories"],
        nutrition["protein"],
        nutrition["carbs"],
        nutrition["fat"]
    )

    result["source"] = nutrition["source"]
    result["food_state"] = nutrition["food_state"]

    return result
