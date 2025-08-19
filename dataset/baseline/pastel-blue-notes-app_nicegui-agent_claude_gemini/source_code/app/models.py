from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    # Relationships
    categories: List["Category"] = Relationship(back_populates="user")
    notes: List["Note"] = Relationship(back_populates="user")


class Category(SQLModel, table=True):
    __tablename__ = "categories"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    color: str = Field(default="#E3F2FD", max_length=7)  # Default pastel blue
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="categories")
    notes: List["Note"] = Relationship(back_populates="category")


class Note(SQLModel, table=True):
    __tablename__ = "notes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    content: str = Field(default="")
    user_id: int = Field(foreign_key="users.id")
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_pinned: bool = Field(default=False)

    # Relationships
    user: User = Relationship(back_populates="notes")
    category: Optional[Category] = Relationship(back_populates="notes")


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    email: str = Field(max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(min_length=8, max_length=100)


class UserLogin(SQLModel, table=False):
    email: str = Field(max_length=255)
    password: str = Field(max_length=100)


class UserResponse(SQLModel, table=False):
    id: int
    email: str
    created_at: datetime
    is_active: bool


class CategoryCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    color: str = Field(default="#E3F2FD", max_length=7)


class CategoryUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    color: Optional[str] = Field(default=None, max_length=7)


class CategoryResponse(SQLModel, table=False):
    id: int
    name: str
    description: str
    color: str
    user_id: int
    created_at: datetime
    updated_at: datetime


class NoteCreate(SQLModel, table=False):
    title: str = Field(max_length=200)
    content: str = Field(default="")
    category_id: Optional[int] = Field(default=None)


class NoteUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = Field(default=None)
    category_id: Optional[int] = Field(default=None)
    is_pinned: Optional[bool] = Field(default=None)


class NoteResponse(SQLModel, table=False):
    id: int
    title: str
    content: str
    user_id: int
    category_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    is_pinned: bool
