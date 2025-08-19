from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime, date
from typing import Optional, List, Dict
from decimal import Decimal
from enum import Enum


class UnitOfMeasurement(str, Enum):
    PIECES = "pieces"
    GRAMS = "grams"
    KILOGRAMS = "kilograms"
    MILLILITERS = "milliliters"
    LITERS = "liters"
    CUPS = "cups"
    TABLESPOONS = "tablespoons"
    TEASPOONS = "teaspoons"
    OUNCES = "ounces"
    POUNDS = "pounds"


class NotificationType(str, Enum):
    EXPIRY_WARNING = "expiry_warning"
    EXPIRED = "expired"
    LOW_STOCK = "low_stock"


class RecipeDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    full_name: str = Field(max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    food_items: List["FoodItem"] = Relationship(back_populates="user")
    notifications: List["Notification"] = Relationship(back_populates="user")


class FoodItem(SQLModel, table=True):
    __tablename__ = "food_items"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    quantity: Decimal = Field(default=Decimal("0"), decimal_places=2, max_digits=10)
    unit: UnitOfMeasurement = Field(default=UnitOfMeasurement.PIECES)
    expiry_date: date
    purchase_date: Optional[date] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default="pantry", max_length=50)  # pantry, fridge, freezer
    notes: Optional[str] = Field(default=None, max_length=500)
    barcode: Optional[str] = Field(default=None, max_length=50)
    is_consumed: bool = Field(default=False)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="food_items")


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    food_item_id: Optional[int] = Field(default=None, foreign_key="food_items.id")
    notification_type: NotificationType
    title: str = Field(max_length=200)
    message: str = Field(max_length=1000)
    is_read: bool = Field(default=False)
    scheduled_for: datetime
    sent_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="notifications")
    food_item: Optional["FoodItem"] = Relationship()


class Recipe(SQLModel, table=True):
    __tablename__ = "recipes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructions: str = Field(max_length=5000)
    prep_time_minutes: Optional[int] = Field(default=None)
    cook_time_minutes: Optional[int] = Field(default=None)
    servings: Optional[int] = Field(default=None)
    difficulty: RecipeDifficulty = Field(default=RecipeDifficulty.MEDIUM)
    cuisine_type: Optional[str] = Field(default=None, max_length=50)
    dietary_tags: List[str] = Field(default=[], sa_column=Column(JSON))  # vegetarian, vegan, gluten-free, etc.
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    ingredients: List["RecipeIngredient"] = Relationship(back_populates="recipe")


class RecipeIngredient(SQLModel, table=True):
    __tablename__ = "recipe_ingredients"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    ingredient_name: str = Field(max_length=100)
    quantity: Decimal = Field(decimal_places=2, max_digits=10)
    unit: UnitOfMeasurement
    is_optional: bool = Field(default=False)
    notes: Optional[str] = Field(default=None, max_length=200)  # "finely chopped", "room temperature", etc.

    # Relationships
    recipe: Recipe = Relationship(back_populates="ingredients")


class PantrySettings(SQLModel, table=True):
    __tablename__ = "pantry_settings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    expiry_warning_days: int = Field(default=3)  # Days before expiry to send warning
    low_stock_threshold: Decimal = Field(default=Decimal("1"), decimal_places=2, max_digits=5)
    enable_expiry_notifications: bool = Field(default=True)
    enable_low_stock_notifications: bool = Field(default=True)
    default_location: str = Field(default="pantry", max_length=50)
    preferred_units: Dict[str, str] = Field(default={}, sa_column=Column(JSON))  # category -> preferred unit mapping
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship()


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    username: str = Field(max_length=50)
    email: str = Field(max_length=255)
    full_name: str = Field(max_length=100)


class UserUpdate(SQLModel, table=False):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = Field(default=None)


class FoodItemCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    quantity: Decimal = Field(decimal_places=2, max_digits=10)
    unit: UnitOfMeasurement = Field(default=UnitOfMeasurement.PIECES)
    expiry_date: date
    purchase_date: Optional[date] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default="pantry", max_length=50)
    notes: Optional[str] = Field(default=None, max_length=500)
    barcode: Optional[str] = Field(default=None, max_length=50)
    user_id: int


class FoodItemUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    quantity: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    unit: Optional[UnitOfMeasurement] = Field(default=None)
    expiry_date: Optional[date] = Field(default=None)
    purchase_date: Optional[date] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=500)
    barcode: Optional[str] = Field(default=None, max_length=50)
    is_consumed: Optional[bool] = Field(default=None)


class NotificationCreate(SQLModel, table=False):
    user_id: int
    food_item_id: Optional[int] = Field(default=None)
    notification_type: NotificationType
    title: str = Field(max_length=200)
    message: str = Field(max_length=1000)
    scheduled_for: datetime


class NotificationUpdate(SQLModel, table=False):
    is_read: Optional[bool] = Field(default=None)
    sent_at: Optional[datetime] = Field(default=None)


class RecipeCreate(SQLModel, table=False):
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructions: str = Field(max_length=5000)
    prep_time_minutes: Optional[int] = Field(default=None)
    cook_time_minutes: Optional[int] = Field(default=None)
    servings: Optional[int] = Field(default=None)
    difficulty: RecipeDifficulty = Field(default=RecipeDifficulty.MEDIUM)
    cuisine_type: Optional[str] = Field(default=None, max_length=50)
    dietary_tags: List[str] = Field(default=[])


class RecipeUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructions: Optional[str] = Field(default=None, max_length=5000)
    prep_time_minutes: Optional[int] = Field(default=None)
    cook_time_minutes: Optional[int] = Field(default=None)
    servings: Optional[int] = Field(default=None)
    difficulty: Optional[RecipeDifficulty] = Field(default=None)
    cuisine_type: Optional[str] = Field(default=None, max_length=50)
    dietary_tags: Optional[List[str]] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class RecipeIngredientCreate(SQLModel, table=False):
    recipe_id: int
    ingredient_name: str = Field(max_length=100)
    quantity: Decimal = Field(decimal_places=2, max_digits=10)
    unit: UnitOfMeasurement
    is_optional: bool = Field(default=False)
    notes: Optional[str] = Field(default=None, max_length=200)


class RecipeIngredientUpdate(SQLModel, table=False):
    ingredient_name: Optional[str] = Field(default=None, max_length=100)
    quantity: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    unit: Optional[UnitOfMeasurement] = Field(default=None)
    is_optional: Optional[bool] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=200)


class PantrySettingsCreate(SQLModel, table=False):
    user_id: int
    expiry_warning_days: int = Field(default=3)
    low_stock_threshold: Decimal = Field(default=Decimal("1"), decimal_places=2, max_digits=5)
    enable_expiry_notifications: bool = Field(default=True)
    enable_low_stock_notifications: bool = Field(default=True)
    default_location: str = Field(default="pantry", max_length=50)
    preferred_units: Dict[str, str] = Field(default={})


class PantrySettingsUpdate(SQLModel, table=False):
    expiry_warning_days: Optional[int] = Field(default=None)
    low_stock_threshold: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=5)
    enable_expiry_notifications: Optional[bool] = Field(default=None)
    enable_low_stock_notifications: Optional[bool] = Field(default=None)
    default_location: Optional[str] = Field(default=None, max_length=50)
    preferred_units: Optional[Dict[str, str]] = Field(default=None)


# Response schemas for API endpoints
class FoodItemResponse(SQLModel, table=False):
    id: int
    name: str
    quantity: Decimal
    unit: UnitOfMeasurement
    expiry_date: str  # ISO format date string
    purchase_date: Optional[str] = Field(default=None)  # ISO format date string
    category: Optional[str] = Field(default=None)
    location: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    barcode: Optional[str] = Field(default=None)
    is_consumed: bool
    days_until_expiry: int
    is_expired: bool
    created_at: str  # ISO format datetime string
    updated_at: str  # ISO format datetime string


class RecipeResponse(SQLModel, table=False):
    id: int
    name: str
    description: Optional[str] = Field(default=None)
    instructions: str
    prep_time_minutes: Optional[int] = Field(default=None)
    cook_time_minutes: Optional[int] = Field(default=None)
    total_time_minutes: Optional[int] = Field(default=None)
    servings: Optional[int] = Field(default=None)
    difficulty: RecipeDifficulty
    cuisine_type: Optional[str] = Field(default=None)
    dietary_tags: List[str]
    ingredients: List["RecipeIngredientResponse"]
    available_ingredients_count: int
    missing_ingredients_count: int
    can_make: bool


class RecipeIngredientResponse(SQLModel, table=False):
    id: int
    ingredient_name: str
    quantity: Decimal
    unit: UnitOfMeasurement
    is_optional: bool
    notes: Optional[str] = Field(default=None)
    is_available: bool
    available_quantity: Optional[Decimal] = Field(default=None)


class NotificationResponse(SQLModel, table=False):
    id: int
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool
    scheduled_for: str  # ISO format datetime string
    sent_at: Optional[str] = Field(default=None)  # ISO format datetime string
    food_item_name: Optional[str] = Field(default=None)
    created_at: str  # ISO format datetime string
