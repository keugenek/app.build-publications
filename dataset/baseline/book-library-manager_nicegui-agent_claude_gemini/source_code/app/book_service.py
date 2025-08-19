from typing import Optional
from sqlmodel import select, and_, or_
from datetime import datetime
from app.database import get_session
from app.models import Book, BookCreate, BookUpdate, BookRead, BookSearch, ReadingStatus


class BookService:
    """Service layer for book management operations."""

    @staticmethod
    def create_book(book_data: BookCreate) -> BookRead:
        """Create a new book in the library."""
        with get_session() as session:
            book = Book(
                title=book_data.title,
                author=book_data.author,
                genre=book_data.genre,
                reading_status=book_data.reading_status,
            )
            session.add(book)
            session.commit()
            session.refresh(book)
            return BookRead.from_book(book)

    @staticmethod
    def get_book(book_id: int) -> Optional[BookRead]:
        """Get a specific book by ID."""
        with get_session() as session:
            book = session.get(Book, book_id)
            if book is None:
                return None
            return BookRead.from_book(book)

    @staticmethod
    def update_book(book_id: int, book_data: BookUpdate) -> Optional[BookRead]:
        """Update an existing book."""
        with get_session() as session:
            book = session.get(Book, book_id)
            if book is None:
                return None

            # Update only provided fields
            if book_data.title is not None:
                book.title = book_data.title
            if book_data.author is not None:
                book.author = book_data.author
            if book_data.genre is not None:
                book.genre = book_data.genre
            if book_data.reading_status is not None:
                book.reading_status = book_data.reading_status

            book.updated_at = datetime.utcnow()

            session.add(book)
            session.commit()
            session.refresh(book)
            return BookRead.from_book(book)

    @staticmethod
    def delete_book(book_id: int) -> bool:
        """Delete a book from the library."""
        with get_session() as session:
            book = session.get(Book, book_id)
            if book is None:
                return False

            session.delete(book)
            session.commit()
            return True

    @staticmethod
    def search_books(search_params: Optional[BookSearch] = None) -> list[BookRead]:
        """Search and filter books based on various criteria."""
        with get_session() as session:
            query = select(Book)

            if search_params:
                conditions = []

                # Text search in title or author
                if search_params.query:
                    search_term = f"%{search_params.query.lower()}%"
                    conditions.append(
                        or_(
                            Book.title.ilike(search_term),  # type: ignore[attr-defined]
                            Book.author.ilike(search_term),  # type: ignore[attr-defined]
                        )
                    )

                # Filter by genre
                if search_params.genre:
                    conditions.append(Book.genre.ilike(f"%{search_params.genre}%"))  # type: ignore[attr-defined]

                # Filter by reading status
                if search_params.reading_status:
                    conditions.append(Book.reading_status == search_params.reading_status)

                if conditions:
                    query = query.where(and_(*conditions))

            # Order by creation date (newest first)
            query = query.order_by(Book.created_at.desc())  # type: ignore[attr-defined]

            books = session.exec(query).all()
            return [BookRead.from_book(book) for book in books]

    @staticmethod
    def get_all_books() -> list[BookRead]:
        """Get all books in the library."""
        return BookService.search_books()

    @staticmethod
    def get_genres() -> list[str]:
        """Get all unique genres from the library."""
        with get_session() as session:
            query = select(Book.genre).distinct().order_by(Book.genre)
            genres = session.exec(query).all()
            return [genre for genre in genres if genre.strip()]

    @staticmethod
    def get_book_count_by_status() -> dict[ReadingStatus, int]:
        """Get count of books by reading status."""
        with get_session() as session:
            counts = {}
            for status in ReadingStatus:
                query = select(Book).where(Book.reading_status == status)
                count = len(session.exec(query).all())
                counts[status] = count
            return counts
