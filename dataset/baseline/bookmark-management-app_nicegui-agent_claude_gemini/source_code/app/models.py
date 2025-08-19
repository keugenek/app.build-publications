from sqlmodel import SQLModel, Field, Relationship, Column, Text
from datetime import datetime
from typing import Optional, List


# Link tables for many-to-many relationships
class BookmarkTagLink(SQLModel, table=True):
    __tablename__ = "bookmark_tag_links"  # type: ignore[assignment]

    bookmark_id: int = Field(foreign_key="bookmarks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password_hash: str = Field(max_length=255)  # Store hashed password
    full_name: str = Field(max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    bookmarks: List["Bookmark"] = Relationship(back_populates="user")
    collections: List["Collection"] = Relationship(back_populates="user")


class Collection(SQLModel, table=True):
    __tablename__ = "collections"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="collections")
    bookmarks: List["Bookmark"] = Relationship(back_populates="collection")


class Tag(SQLModel, table=True):
    __tablename__ = "tags"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=50, index=True)  # Index for search performance
    color: Optional[str] = Field(default=None, max_length=7)  # Hex color code
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    bookmarks: List["Bookmark"] = Relationship(back_populates="tags", link_model=BookmarkTagLink)


class Bookmark(SQLModel, table=True):
    __tablename__ = "bookmarks"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(max_length=2048, index=True)  # Index for search performance
    title: str = Field(max_length=300, index=True)  # Index for search performance
    description: str = Field(default="", sa_column=Column(Text))  # Use Text for longer descriptions
    favicon_url: Optional[str] = Field(default=None, max_length=2048)
    is_favorite: bool = Field(default=False)
    is_archived: bool = Field(default=False)
    user_id: int = Field(foreign_key="users.id")
    collection_id: Optional[int] = Field(default=None, foreign_key="collections.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)  # Index for sorting
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="bookmarks")
    collection: Optional[Collection] = Relationship(back_populates="bookmarks")
    tags: List[Tag] = Relationship(back_populates="bookmarks", link_model=BookmarkTagLink)


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    email: str = Field(max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(max_length=100)


class UserLogin(SQLModel, table=False):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)


class UserResponse(SQLModel, table=False):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: str  # Will be serialized as ISO format


class BookmarkCreate(SQLModel, table=False):
    url: str = Field(max_length=2048, regex=r"^https?://")
    title: str = Field(max_length=300)
    description: str = Field(default="", max_length=5000)
    collection_id: Optional[int] = Field(default=None)
    tag_names: List[str] = Field(default=[])  # Tag names to associate


class BookmarkUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None, max_length=5000)
    is_favorite: Optional[bool] = Field(default=None)
    is_archived: Optional[bool] = Field(default=None)
    collection_id: Optional[int] = Field(default=None)
    tag_names: Optional[List[str]] = Field(default=None)


class BookmarkResponse(SQLModel, table=False):
    id: int
    url: str
    title: str
    description: str
    favicon_url: Optional[str]
    is_favorite: bool
    is_archived: bool
    collection_id: Optional[int]
    created_at: str
    updated_at: str
    tags: List[str]  # Tag names
    collection_name: Optional[str]


class CollectionCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)


class CollectionUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class CollectionResponse(SQLModel, table=False):
    id: int
    name: str
    description: str
    bookmark_count: int
    created_at: str
    updated_at: str


class TagCreate(SQLModel, table=False):
    name: str = Field(max_length=50)
    color: Optional[str] = Field(default=None, max_length=7, regex=r"^#[0-9A-Fa-f]{6}$")


class TagUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=7, regex=r"^#[0-9A-Fa-f]{6}$")


class TagResponse(SQLModel, table=False):
    id: int
    name: str
    color: Optional[str]
    bookmark_count: int
    created_at: str


class BookmarkSearchQuery(SQLModel, table=False):
    query: str = Field(min_length=1, max_length=500)
    tags: Optional[List[str]] = Field(default=None)
    collection_id: Optional[int] = Field(default=None)
    is_favorite: Optional[bool] = Field(default=None)
    is_archived: Optional[bool] = Field(default=None)
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
