import os
import re
import jwt

from datetime import datetime, timedelta, timezone, date
from pwdlib import PasswordHash

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError
from io import BytesIO

from predictor import predict_food
from nutrition_engine import calculate_nutrition
from food_database import (
    get_food_nutrition,
    get_all_foods,
    get_food_states
)

from database import SessionLocal, Base, engine
from models import ScanHistory, Food, User, FitnessWorkout, WaterIntake
from email_service import send_notification
from zoneinfo import ZoneInfo
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

app = FastAPI(
    title="NutriVision API",
    description="AI-Based Food Detection and Personalized Nutrition Analysis",
    version="1.0.0"
)


# AUTHENTICATION CONFIGURATION
password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv(
    "NUTRIVISION_SECRET_KEY",
    "dev-only-change-this-secret-before-deployment"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# DATABASE INITIALIZATION
@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)

    from seed_data import add_food_records
    add_food_records()


# CORS CONFIGURATION
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REQUEST MODELS
class NutritionRequest(BaseModel):
    food_name: str
    food_state: str
    quantity: float = Field(gt=0)


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

# HELPER FUNCTIONS
def normalize_email(email: str):
    email = email.strip().lower()

    if not re.fullmatch(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        email
    ):
        raise HTTPException(
            status_code=422,
            detail="Please enter a valid email address"
        )

    return email


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# VERIFY LOGIN TOKEN
def get_current_user_id(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Please login to continue"
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload.get("sub"))

    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login session"
        )

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="User account not found or inactive"
            )

        return user.id

    finally:
        db.close()


# SIGNUP API
@app.post("/auth/signup")
def signup(data: SignupRequest):

    db = SessionLocal()

    try:
        email = normalize_email(data.email)

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists"
            )

        hashed_password = password_hash.hash(data.password)

        new_user = User(
            full_name=data.full_name.strip(),
            email=email,
            hashed_password=hashed_password,
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # SEND WELCOME EMAIL
        try:
            send_notification(
                new_user.email,
                "Welcome to NutriVision!",
                f"""Hello {new_user.full_name},

Welcome to NutriVision!

Your account has been created successfully.

You can now explore:
- AI Food Detection
- Nutrition Analytics
- Fitness Tracker
- Water Intake Tracker

Thank you for joining NutriVision!

Regards,
NutriVision Team"""
            )
        except Exception as email_error:
            print("Welcome email failed:", email_error)

        return {
            "message": "Account created successfully",
            "email_notification": "Attempted",
            "user": {
                "id": new_user.id,
                "full_name": new_user.full_name,
                "email": new_user.email
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()
        print("Signup error:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to create account"
        )

    finally:
        db.close()


# LOGIN API

# LOGIN API
@app.post("/auth/login")
def login(data: LoginRequest):

    db = SessionLocal()

    try:
        email = normalize_email(data.email)

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user or not password_hash.verify(
            data.password,
            user.hashed_password
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="This account is inactive"
            )

        access_token = create_access_token(user.id)

        # SEND LOGIN EMAIL
        email_notification = "Not sent"

        try:
            send_notification(
                user.email,
                "New Login to NutriVision",
                f"""Hello {user.full_name},

You have successfully signed in to your NutriVision account.

Login time: {datetime.now().strftime("%d-%m-%Y %I:%M %p")}

If this login was not performed by you, please secure your account.

Regards,
NutriVision Team"""
            )
            email_notification = "Attempted"

        except Exception as email_error:
            print("Login email failed:", email_error)
            email_notification = "Failed"

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "email_notification": email_notification,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
        }

    finally:
        db.close()



# LOGOUT API
@app.post("/auth/logout")
def logout(user_id: int = Depends(get_current_user_id)):

    db = SessionLocal()

    try:
        user = db.query(User).filter(
            User.id == user_id
        ).first()

        email_notification = "Not sent"

        if user:
            try:
                send_notification(
                    user.email,
                    "Logout Successful - NutriVision",
                    f"""Hello {user.full_name},

You have successfully logged out of your NutriVision account.

Logout time: {datetime.now().strftime("%d-%m-%Y %I:%M %p")}

Thank you for using NutriVision!

Regards,
NutriVision Team"""
                )
                email_notification = "Attempted"

            except Exception as email_error:
                print("Logout email failed:", email_error)
                email_notification = "Failed"

        return {
            "message": "Logout successful",
            "email_notification": email_notification
        }

    finally:
        db.close()

@app.get("/auth/me")
def get_my_profile(user_id: int = Depends(get_current_user_id)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "is_active": user.is_active
        }
    finally:
        db.close()


@app.put("/auth/profile")
def update_my_profile(
    data: UpdateProfileRequest,
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        email = normalize_email(data.email)

        existing_user = db.query(User).filter(
            User.email == email,
            User.id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email is already registered"
            )

        user.full_name = data.full_name.strip()
        user.email = email

        db.commit()
        db.refresh(user)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
        }
    finally:
        db.close()


@app.put("/auth/change-password")
def change_my_password(
    data: ChangePasswordRequest,
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not password_hash.verify(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )

        user.hashed_password = password_hash.hash(data.new_password)
        db.commit()

        return {"message": "Password changed successfully"}
    finally:
        db.close()
        
# FOOD HISTORY API
@app.get("/history")
def get_scan_history():

    db = SessionLocal()

    try:
        records = (
            db.query(ScanHistory)
            .order_by(ScanHistory.id.desc())
            .all()
        )

        return {
            "total_scans": len(records),
            "history": [
                {
                    "id": record.id,
                    "filename": record.filename,
                    "predicted_food": record.predicted_food,
                    "confidence": record.confidence,
                    "food_state": record.food_state,
                    "quantity": record.quantity,
                    "calories": record.calories,
                    "protein": record.protein,
                    "carbs": record.carbs,
                    "fat": record.fat,
                    "nutrition_available": bool(
                        record.nutrition_available
                    ),
                    "created_at": record.created_at
                }
                for record in records
            ]
        }

    finally:
        db.close()


# DATABASE MANAGEMENT API
@app.get("/database/overview")
def database_overview():

    db = SessionLocal()

    try:
        foods = (
            db.query(Food)
            .order_by(Food.id.asc())
            .all()
        )

        scans = db.query(ScanHistory).all()

        return {
            "total_foods": len(foods),
            "total_scans": len(scans),

            "foods": [
                {
                    "id": food.id,
                    "food_name": food.food_name,
                    "food_state": food.food_state,
                    "calories": food.calories,
                    "protein": food.protein,
                    "carbs": food.carbs,
                    "fat": food.fat,
                    "unit": food.unit,
                    "source": food.source
                }
                for food in foods
            ]
        }

    finally:
        db.close()


# FOOD DATABASE API
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


# NUTRITION FROM DATABASE API
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


# BASIC AI PREDICTION API
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):

    if file.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG or WEBP image"
        )

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")

        result = predict_food(image)

        return {
            "filename": file.filename,
            "prediction": result
        }

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )

    finally:
        await file.close()


# AI PREDICTION + NUTRITION + HISTORY API
@app.post("/predict-and-nutrition")
async def predict_and_nutrition(
    file: UploadFile = File(...),
    food_state: str = Form(...),
    quantity: float = Form(...),
    authorization: str = Header(default="")
):

    if file.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG or WEBP image"
        )

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    current_user = None

    # VERIFY LOGIN TOKEN
    if authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            current_user_id = int(payload.get("sub"))

            user_db = SessionLocal()
            try:
                current_user = user_db.query(User).filter(
                    User.id == current_user_id,
                    User.is_active == True
                ).first()
            finally:
                user_db.close()

        except (jwt.InvalidTokenError, TypeError, ValueError):
            current_user = None

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")

        prediction = predict_food(image)
        predicted_label = prediction["predicted_food"].lower()

        aliases = {
    "aloo_gobi": "Aloo Gobi",
    "aloo_masala": "Aloo Masala",
    "bhindi_masala": "Bhindi Masala",
    "biryani": "Biryani",
    "burger": "Burger",
    "butter_naan": "Butter Naan",
    "chai": "Chai",
    "chapati": "Chapati",
    "chicken_curry": "Chicken Curry",
    "chole": "Chole",
    "chole_bhature": "Chole Bhature",
    "coconut_chutney": "Coconut Chutney",
    "dal_makhani": "Dal Makhani",
    "dhokla": "Dhokla",
    "dum_aloo": "Dum Aloo",
    "fish_curry": "Fish Curry",
    "fried_rice": "Fried Rice",
    "ghevar": "Ghevar",
    "green_chutney": "Green Chutney",
    "gulab_jamun": "Gulab Jamun",
    "idli": "Idli",
    "jalebi": "Jalebi",
    "kaathi_rolls": "Kathi Rolls",
    "kadai_paneer": "Kadai Paneer",
    "kebab": "Kebab",
    "kheer": "Kheer",
    "kulfi": "Kulfi",
    "lassi": "Lassi",
    "masala_dosa": "Masala Dosa",
    "modak": "Modak",
    "momos": "Momos",
    "mutton_curry": "Mutton Curry",
    "paani_puri": "Pani Puri",
    "pakode": "Pakode",
    "palak_paneer": "Palak Paneer",
    "pav_bhaji": "Pav Bhaji",
    "pizza": "Pizza",
    "poha": "Poha",
    "rajma_curry": "Rajma Curry",
    "ras_malai": "Ras Malai",
    "samosa": "Samosa",
    "shahi_paneer": "Shahi Paneer",
    "white_rice": "Cooked White Rice"
}

        db_food_name = aliases.get(predicted_label)

        food_data = None

        if db_food_name is not None:
            food_data = get_food_nutrition(
                db_food_name,
                food_state
            )

        nutrition = None

        if food_data is not None:
            nutrition = calculate_nutrition(
                food_data["food_name"],
                quantity,
                food_data["calories"],
                food_data["protein"],
                food_data["carbs"],
                food_data["fat"]
            )

        # SAVE SCAN TO HISTORY
        db = SessionLocal()

        try:
            record = ScanHistory(
                user_id=current_user.id if current_user else None,
                filename=file.filename,
                predicted_food=prediction["predicted_food"],
                confidence=prediction["confidence"],
                food_state=food_state,
                quantity=quantity,
                calories=nutrition["calories"] if nutrition else None,
                protein=nutrition["protein"] if nutrition else None,
                carbs=nutrition["carbs"] if nutrition else None,
                fat=nutrition["fat"] if nutrition else None,
                nutrition_available=1 if nutrition else 0,
                created_at=datetime.now().strftime("%d-%m-%Y %I:%M %p")
            )

            db.add(record)
            db.commit()

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

        # SEND FOOD SCAN EMAIL
        email_notification = "Not sent - login required"

        if current_user:
            try:
                if nutrition:
                    email_body = f"""Hello {current_user.full_name},

Your food scan has been completed successfully!

Food: {prediction["predicted_food"]}
Model Confidence: {prediction["confidence"]}%
Preparation State: {food_state}
Quantity: {quantity} grams

Nutrition Information:
Calories: {nutrition["calories"]} kcal
Protein: {nutrition["protein"]} g
Carbohydrates: {nutrition["carbs"]} g
Fat: {nutrition["fat"]} g

Thank you for using NutriVision!

Regards,
NutriVision Team"""
                else:
                    email_body = f"""Hello {current_user.full_name},

Your food scan has been completed successfully!

Food: {prediction["predicted_food"]}
Model Confidence: {prediction["confidence"]}%
Preparation State: {food_state}
Quantity: {quantity} grams

Nutrition data is currently unavailable for this food.

Thank you for using NutriVision!

Regards,
NutriVision Team"""

                send_notification(
                    current_user.email,
                    "Food Scan Report - NutriVision",
                    email_body
                )

                email_notification = "Attempted"

            except Exception as email_error:
                print("Food scan email failed:", email_error)
                email_notification = "Failed"

        if nutrition is None:
            return {
                "prediction": prediction,
                "nutrition_available": False,
                "message": "Nutrition data is not available for this predicted food or preparation state.",
                "history_saved": True,
                "email_notification": email_notification
            }

        return {
            "prediction": prediction,
            "nutrition_available": True,
            "nutrition_status": "provisional",
            "nutrition": nutrition,
            "source": food_data["source"],
            "note": "Nutrition values are sample data and have not been independently verified.",
            "history_saved": True,
            "email_notification": email_notification
        }

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )

    finally:
        await file.close()



# ==========================================
# FITNESS TRACKER + WATER TRACKER APIs
# ==========================================

# REQUEST MODELS

class WorkoutRequest(BaseModel):
    activity: str = Field(min_length=2, max_length=100)
    duration: float = Field(gt=0, le=1440)
    calories_burned: float = Field(ge=0)


class WaterIntakeRequest(BaseModel):
    glasses: int = Field(ge=0, le=100)
    daily_goal: int = Field(gt=0, le=100)


# ------------------------------------------
# ADD FITNESS WORKOUT
# ------------------------------------------


# ADD FITNESS WORKOUT
@app.post("/fitness/workouts")
def add_fitness_workout(
    data: WorkoutRequest,
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()

    try:
        workout = FitnessWorkout(
            user_id=user_id,
            activity=data.activity,
            duration=data.duration,
            calories_burned=data.calories_burned
        )

        db.add(workout)
        db.commit()
        db.refresh(workout)

        # GET USER EMAIL
        user = db.query(User).filter(
            User.id == user_id
        ).first()

        # SEND WORKOUT EMAIL
        if user:
            try:
                send_notification(
                    user.email,
                    "Workout Completed - NutriVision",
                    f"""Hello {user.full_name},

Your workout has been recorded successfully!

Activity: {workout.activity}
Duration: {workout.duration} minutes
Estimated Calories Burned: {workout.calories_burned} kcal

Keep moving and stay healthy!

Regards,
NutriVision Team"""
                )
            except Exception as email_error:
                print("Workout email failed:", email_error)

        return {
            "message": "Workout saved successfully",
            "email_notification": "Attempted",
            "workout": {
                "id": workout.id,
                "activity": workout.activity,
                "duration": workout.duration,
                "calories_burned": workout.calories_burned,
                "created_at": workout.created_at.isoformat()
            }
        }

    except Exception as error:
        db.rollback()
        print("Workout error:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to save workout"
        )

    finally:
        db.close()


# ------------------------------------------
# GET FITNESS WORKOUT HISTORY
# ------------------------------------------

@app.get("/fitness/workouts")
def get_fitness_workouts(
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()

    try:
        workouts = (
            db.query(FitnessWorkout)
            .filter(FitnessWorkout.user_id == user_id)
            .order_by(FitnessWorkout.created_at.desc())
            .all()
        )

        return {
            "total_workouts": len(workouts),
            "total_calories_burned": round(
                sum(w.calories_burned for w in workouts), 2
            ),
            "workouts": [
                {
                    "id": w.id,
                    "activity": w.activity,
                    "duration": w.duration,
                    "calories_burned": w.calories_burned,
                    "created_at": w.created_at.isoformat()
                }
                for w in workouts
            ]
        }

    finally:
        db.close()


# ------------------------------------------
# DELETE FITNESS WORKOUT
# ------------------------------------------

@app.delete("/fitness/workouts/{workout_id}")
def delete_fitness_workout(
    workout_id: int,
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()

    try:
        workout = (
            db.query(FitnessWorkout)
            .filter(
                FitnessWorkout.id == workout_id,
                FitnessWorkout.user_id == user_id
            )
            .first()
        )

        if not workout:
            raise HTTPException(
                status_code=404,
                detail="Workout not found"
            )

        db.delete(workout)
        db.commit()

        return {
            "message": "Workout deleted successfully"
        }

    finally:
        db.close()


# ------------------------------------------
# GET TODAY'S WATER INTAKE
# ------------------------------------------

@app.get("/water/today")
def get_today_water_intake(
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()

    try:
        today = date.today()

        record = (
            db.query(WaterIntake)
            .filter(
                WaterIntake.user_id == user_id,
                WaterIntake.intake_date == today
            )
            .first()
        )

        if not record:
            return {
                "date": today.isoformat(),
                "glasses": 0,
                "daily_goal": 8,
                "progress": 0
            }

        progress = min(
            round((record.glasses / record.daily_goal) * 100),
            100
        )

        return {
            "date": today.isoformat(),
            "glasses": record.glasses,
            "daily_goal": record.daily_goal,
            "progress": progress
        }

    finally:
        db.close()


# ------------------------------------------
# UPDATE TODAY'S WATER INTAKE
# ------------------------------------------

@app.put("/water/today")
def update_today_water_intake(
    data: WaterIntakeRequest,
    user_id: int = Depends(get_current_user_id)
):
    db = SessionLocal()

    try:
        today = date.today()

        record = (
            db.query(WaterIntake)
            .filter(
                WaterIntake.user_id == user_id,
                WaterIntake.intake_date == today
            )
            .first()
        )

        if record:
            record.glasses = data.glasses
            record.daily_goal = data.daily_goal
            record.updated_at = datetime.utcnow()

        else:
            record = WaterIntake(
                user_id=user_id,
                intake_date=today,
                glasses=data.glasses,
                daily_goal=data.daily_goal
            )
            db.add(record)

        db.commit()
        db.refresh(record)

        progress = min(
            round((record.glasses / record.daily_goal) * 100),
            100
        )

        return {
            "message": "Water intake updated successfully",
            "date": today.isoformat(),
            "glasses": record.glasses,
            "daily_goal": record.daily_goal,
            "progress": progress
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update water intake"
        )

    finally:
        db.close()



# ==========================================
# WEEKLY PROGRESS REPORT API
# ==========================================

def parse_scan_datetime(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        pass

    try:
        return datetime.strptime(
            value, "%d-%m-%Y %I:%M %p"
        )
    except (ValueError, TypeError):
        return None


def send_weekly_progress_report(user_id: int):
    db = SessionLocal()

    try:
        user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        now = datetime.now()
        start_date = now - timedelta(days=7)

        # USER'S FOOD SCANS
        all_scans = db.query(ScanHistory).filter(
            ScanHistory.user_id == user_id
        ).all()

        weekly_scans = []

        for scan in all_scans:
            scan_date = parse_scan_datetime(scan.created_at)

            if scan_date and start_date <= scan_date <= now:
                weekly_scans.append(scan)

        # FOOD NUTRITION TOTALS
        total_calories = sum(
            scan.calories or 0 for scan in weekly_scans
        )
        total_protein = sum(
            scan.protein or 0 for scan in weekly_scans
        )
        total_carbs = sum(
            scan.carbs or 0 for scan in weekly_scans
        )
        total_fat = sum(
            scan.fat or 0 for scan in weekly_scans
        )

        # USER'S WORKOUTS
        weekly_workouts = db.query(FitnessWorkout).filter(
            FitnessWorkout.user_id == user_id,
            FitnessWorkout.created_at >= start_date,
            FitnessWorkout.created_at <= now
        ).all()

        total_workout_minutes = sum(
            workout.duration for workout in weekly_workouts
        )

        total_burned = sum(
            workout.calories_burned for workout in weekly_workouts
        )

        # USER'S WATER INTAKE
        weekly_water = db.query(WaterIntake).filter(
            WaterIntake.user_id == user_id,
            WaterIntake.intake_date >= start_date.date(),
            WaterIntake.intake_date <= now.date()
        ).all()

        total_water_glasses = sum(
            water.glasses for water in weekly_water
        )

        water_days = len(weekly_water)

        average_water = (
            round(total_water_glasses / water_days, 1)
            if water_days else 0
        )

        # EMAIL REPORT
        email_body = f"""Hello {user.full_name},

Here is your NutriVision Weekly Progress Report!

Report Period:
{start_date.strftime("%d-%m-%Y")} to {now.strftime("%d-%m-%Y")}

FOOD & NUTRITION
Total Food Scans: {len(weekly_scans)}
Total Calories: {round(total_calories, 2)} kcal
Protein: {round(total_protein, 2)} g
Carbohydrates: {round(total_carbs, 2)} g
Fat: {round(total_fat, 2)} g

FITNESS PROGRESS
Total Workouts: {len(weekly_workouts)}
Workout Duration: {round(total_workout_minutes, 2)} minutes
Calories Burned: {round(total_burned, 2)} kcal

WATER INTAKE
Total Glasses: {total_water_glasses}
Days With Recorded Intake: {water_days}
Average Glasses Per Recorded Day: {average_water}

Keep tracking your health and stay consistent!

Thank you for using NutriVision.

Regards,
NutriVision Team"""

        try:
            send_notification(
                user.email,
                "Your Weekly Progress Report - NutriVision",
                email_body
            )

        except Exception as email_error:
            print("Weekly report email failed:", email_error)
            raise HTTPException(
                status_code=500,
                detail="Unable to send weekly report email. Check backend terminal."
            )

        return {
            "message": "Weekly progress report email sent successfully",
            "period_start": start_date.strftime("%d-%m-%Y"),
            "period_end": now.strftime("%d-%m-%Y"),
            "food_scans": len(weekly_scans),
            "workouts": len(weekly_workouts),
            "water_glasses": total_water_glasses
        }

    finally:
        db.close()

# MANUAL WEEKLY REPORT API
@app.post("/reports/weekly/send")
def send_weekly_progress_report_api(
    user_id: int = Depends(get_current_user_id)
):
    return send_weekly_progress_report(user_id)


# AUTOMATIC WEEKLY REPORT FUNCTION
def send_weekly_reports_to_all_users():
    db = SessionLocal()

    try:
        user_ids = [
            user.id
            for user in db.query(User).filter(
                User.is_active == True
            ).all()
        ]
    finally:
        db.close()

    for user_id in user_ids:
        try:
            send_weekly_progress_report(user_id)
            print(f"Weekly report sent for user ID: {user_id}")
        except Exception as error:
            print(f"Weekly report failed for user ID {user_id}: {error}")


# SUNDAY 8 PM SCHEDULER
scheduler = BackgroundScheduler(
    timezone=ZoneInfo("Asia/Kolkata")
)

scheduler.add_job(
    send_weekly_reports_to_all_users,
    CronTrigger(
        day_of_week="sun",
        hour=20,
        minute=0
    ),
    id="weekly_progress_report",
    replace_existing=True
)

scheduler.start()

print("Weekly report scheduler started: Every Sunday at 8 PM IST")
