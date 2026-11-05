def calculate_nutrition(food_name, quantity, calories, protein, carbs, fat):

    multiplier = quantity / 100

    return {
        "food": food_name,
        "quantity_g": quantity,
        "calories": round(calories * multiplier, 2),
        "protein": round(protein * multiplier, 2),
        "carbs": round(carbs * multiplier, 2),
        "fat": round(fat * multiplier, 2)
    }

