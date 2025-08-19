from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

# Persistent models (stored in database)


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, max_length=50)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=100)
    bio: str = Field(default="", max_length=500)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    recipes: List["Recipe"] = Relationship(back_populates="author")
    favorite_recipes: List["UserRecipeFavorite"] = Relationship(back_populates="user")


class Category(SQLModel, table=True):
    __tablename__ = "categories"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=50)
    description: str = Field(default="", max_length=200)
    slug: str = Field(unique=True, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    recipe_categories: List["RecipeCategory"] = Relationship(back_populates="category")


class Recipe(SQLModel, table=True):
    __tablename__ = "recipes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    prep_time_minutes: Optional[int] = Field(default=None, ge=0)
    cook_time_minutes: Optional[int] = Field(default=None, ge=0)
    servings: Optional[int] = Field(default=None, ge=1)
    difficulty_level: str = Field(default="medium", max_length=20)  # easy, medium, hard
    is_published: bool = Field(default=True)
    author_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    author: User = Relationship(back_populates="recipes")
    ingredients: List["RecipeIngredient"] = Relationship(back_populates="recipe", cascade_delete=True)
    instructions: List["RecipeInstruction"] = Relationship(back_populates="recipe", cascade_delete=True)
    categories: List["RecipeCategory"] = Relationship(back_populates="recipe", cascade_delete=True)
    favorites: List["UserRecipeFavorite"] = Relationship(back_populates="recipe", cascade_delete=True)


class Ingredient(SQLModel, table=True):
    __tablename__ = "ingredients"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=100)
    category: str = Field(default="other", max_length=50)  # vegetables, meat, dairy, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    recipe_ingredients: List["RecipeIngredient"] = Relationship(back_populates="ingredient")


class RecipeIngredient(SQLModel, table=True):
    __tablename__ = "recipe_ingredients"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    ingredient_id: int = Field(foreign_key="ingredients.id")
    quantity: str = Field(max_length=50)  # e.g., "2 cups", "1 tsp", "to taste"
    notes: str = Field(default="", max_length=200)  # e.g., "chopped", "optional"
    order_index: int = Field(default=0, ge=0)

    # Relationships
    recipe: Recipe = Relationship(back_populates="ingredients")
    ingredient: Ingredient = Relationship(back_populates="recipe_ingredients")


class RecipeInstruction(SQLModel, table=True):
    __tablename__ = "recipe_instructions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    step_number: int = Field(ge=1)
    instruction: str = Field(max_length=1000)
    time_minutes: Optional[int] = Field(default=None, ge=0)  # Optional time for this step
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    recipe: Recipe = Relationship(back_populates="instructions")


class RecipeCategory(SQLModel, table=True):
    __tablename__ = "recipe_categories"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    category_id: int = Field(foreign_key="categories.id")

    # Relationships
    recipe: Recipe = Relationship(back_populates="categories")
    category: Category = Relationship(back_populates="recipe_categories")


class UserRecipeFavorite(SQLModel, table=True):
    __tablename__ = "user_recipe_favorites"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    recipe_id: int = Field(foreign_key="recipes.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="favorite_recipes")
    recipe: Recipe = Relationship(back_populates="favorites")


# Non-persistent schemas (for validation, forms, API requests/responses)


class UserCreate(SQLModel, table=False):
    username: str = Field(max_length=50)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(max_length=100)
    bio: str = Field(default="", max_length=500)


class UserUpdate(SQLModel, table=False):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=500)


class UserLogin(SQLModel, table=False):
    username: str
    password: str


class CategoryCreate(SQLModel, table=False):
    name: str = Field(max_length=50)
    description: str = Field(default="", max_length=200)
    slug: str = Field(max_length=50)


class CategoryUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=50)


class IngredientCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    category: str = Field(default="other", max_length=50)


class RecipeIngredientCreate(SQLModel, table=False):
    ingredient_name: str = Field(max_length=100)  # Allow creating ingredients on the fly
    quantity: str = Field(max_length=50)
    notes: str = Field(default="", max_length=200)
    order_index: int = Field(default=0, ge=0)


class RecipeInstructionCreate(SQLModel, table=False):
    step_number: int = Field(ge=1)
    instruction: str = Field(max_length=1000)
    time_minutes: Optional[int] = Field(default=None, ge=0)


class RecipeCreate(SQLModel, table=False):
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    prep_time_minutes: Optional[int] = Field(default=None, ge=0)
    cook_time_minutes: Optional[int] = Field(default=None, ge=0)
    servings: Optional[int] = Field(default=None, ge=1)
    difficulty_level: str = Field(default="medium", max_length=20)
    ingredients: List[RecipeIngredientCreate] = Field(default=[])
    instructions: List[RecipeInstructionCreate] = Field(default=[])
    category_ids: List[int] = Field(default=[])


class RecipeUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    prep_time_minutes: Optional[int] = Field(default=None, ge=0)
    cook_time_minutes: Optional[int] = Field(default=None, ge=0)
    servings: Optional[int] = Field(default=None, ge=1)
    difficulty_level: Optional[str] = Field(default=None, max_length=20)
    is_published: Optional[bool] = Field(default=None)


class RecipeSearch(SQLModel, table=False):
    query: Optional[str] = Field(default=None, max_length=200)
    category_ids: List[int] = Field(default=[])
    difficulty_level: Optional[str] = Field(default=None)
    max_prep_time: Optional[int] = Field(default=None, ge=0)
    max_cook_time: Optional[int] = Field(default=None, ge=0)
    author_id: Optional[int] = Field(default=None)
