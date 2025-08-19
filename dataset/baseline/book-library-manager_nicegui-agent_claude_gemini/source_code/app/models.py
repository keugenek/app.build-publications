from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class ReadingStatus(str, Enum):
    """Enumeration for book reading status."""

    READ = "read"
    READING = "reading"
    WANT_TO_READ = "want to read"


# Persistent models (stored in database)
class Book(SQLModel, table=True):
    """Book model for library management."""

    __tablename__ = "books"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=255, index=True)
    author: str = Field(max_length=255, index=True)
    genre: str = Field(max_length=100, index=True)
    reading_status: ReadingStatus = Field(default=ReadingStatus.WANT_TO_READ, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def __str__(self) -> str:
        return f"{self.title} by {self.author}"


# Non-persistent schemas (for validation, forms, API requests/responses)
class BookCreate(SQLModel, table=False):
    """Schema for creating a new book."""

    title: str = Field(max_length=255)
    author: str = Field(max_length=255)
    genre: str = Field(max_length=100)
    reading_status: ReadingStatus = Field(default=ReadingStatus.WANT_TO_READ)


class BookUpdate(SQLModel, table=False):
    """Schema for updating an existing book."""

    title: Optional[str] = Field(default=None, max_length=255)
    author: Optional[str] = Field(default=None, max_length=255)
    genre: Optional[str] = Field(default=None, max_length=100)
    reading_status: Optional[ReadingStatus] = Field(default=None)


class BookRead(SQLModel, table=False):
    """Schema for reading/displaying book data."""

    id: int
    title: str
    author: str
    genre: str
    reading_status: ReadingStatus
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_book(cls, book: Book) -> "BookRead":
        """Create BookRead from Book model."""
        if book.id is None:
            raise ValueError("Book ID cannot be None")

        return cls(
            id=book.id,
            title=book.title,
            author=book.author,
            genre=book.genre,
            reading_status=book.reading_status,
            created_at=book.created_at,
            updated_at=book.updated_at,
        )


class BookSearch(SQLModel, table=False):
    """Schema for book search parameters."""

    query: Optional[str] = Field(default=None, max_length=255, description="Search by title or author")
    genre: Optional[str] = Field(default=None, max_length=100, description="Filter by genre")
    reading_status: Optional[ReadingStatus] = Field(default=None, description="Filter by reading status")
