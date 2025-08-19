import pytest
from app.database import reset_db
from app.book_service import BookService
from app.models import BookCreate, BookUpdate, ReadingStatus


@pytest.fixture
def fresh_db():
    """Reset database for each test."""
    reset_db()
    yield
    reset_db()


def test_complete_book_lifecycle(fresh_db):
    """Test the complete lifecycle of a book from creation to deletion."""
    # Create a book
    book_data = BookCreate(
        title="Test Book", author="Test Author", genre="Test Genre", reading_status=ReadingStatus.WANT_TO_READ
    )

    created_book = BookService.create_book(book_data)
    assert created_book.title == "Test Book"
    assert created_book.reading_status == ReadingStatus.WANT_TO_READ

    # Update the book
    update_data = BookUpdate(reading_status=ReadingStatus.READING, genre="Updated Genre")

    updated_book = BookService.update_book(created_book.id, update_data)
    assert updated_book is not None
    assert updated_book.reading_status == ReadingStatus.READING
    assert updated_book.genre == "Updated Genre"
    assert updated_book.title == "Test Book"  # Should remain unchanged

    # Search for the book
    search_results = BookService.search_books()
    assert len(search_results) == 1
    assert search_results[0].id == created_book.id

    # Delete the book
    success = BookService.delete_book(created_book.id)
    assert success is True

    # Verify deletion
    deleted_book = BookService.get_book(created_book.id)
    assert deleted_book is None

    # Verify empty library
    all_books = BookService.get_all_books()
    assert len(all_books) == 0


def test_library_with_multiple_books(fresh_db):
    """Test library operations with multiple books."""
    # Create multiple books
    books_data = [
        BookCreate(title="Book A", author="Author 1", genre="Fiction", reading_status=ReadingStatus.READ),
        BookCreate(title="Book B", author="Author 2", genre="Mystery", reading_status=ReadingStatus.READING),
        BookCreate(title="Book C", author="Author 1", genre="Fiction", reading_status=ReadingStatus.WANT_TO_READ),
        BookCreate(title="Book D", author="Author 3", genre="Science Fiction", reading_status=ReadingStatus.READ),
    ]

    created_books = []
    for book_data in books_data:
        created_books.append(BookService.create_book(book_data))

    # Test getting all books
    all_books = BookService.get_all_books()
    assert len(all_books) == 4

    # Test genre filtering
    genres = BookService.get_genres()
    assert "Fiction" in genres
    assert "Mystery" in genres
    assert "Science Fiction" in genres

    # Test status counts
    status_counts = BookService.get_book_count_by_status()
    assert status_counts[ReadingStatus.READ] == 2
    assert status_counts[ReadingStatus.READING] == 1
    assert status_counts[ReadingStatus.WANT_TO_READ] == 1

    # Test complex search
    from app.models import BookSearch

    # Search by author
    author_search = BookService.search_books(BookSearch(query="Author 1"))
    assert len(author_search) == 2

    # Search by genre and status
    fiction_read = BookService.search_books(BookSearch(genre="Fiction", reading_status=ReadingStatus.READ))
    assert len(fiction_read) >= 1
    fiction_read_titles = [book.title for book in fiction_read]
    assert "Book A" in fiction_read_titles


def test_search_edge_cases(fresh_db):
    """Test search functionality with edge cases."""
    # Create test data
    BookService.create_book(BookCreate(title="The Great Book", author="Great Author", genre="Adventure"))

    BookService.create_book(BookCreate(title="Another Story", author="Different Writer", genre="Drama"))

    from app.models import BookSearch

    # Test case insensitive search
    results = BookService.search_books(BookSearch(query="great"))
    assert len(results) == 1

    results = BookService.search_books(BookSearch(query="GREAT"))
    assert len(results) == 1

    # Test partial matches
    results = BookService.search_books(BookSearch(query="Grea"))
    assert len(results) == 1

    # Test no matches
    results = BookService.search_books(BookSearch(query="NonExistent"))
    assert len(results) == 0

    # Test genre filtering
    results = BookService.search_books(BookSearch(genre="Adventure"))
    assert len(results) == 1

    # Test empty search returns all
    results = BookService.search_books(BookSearch())
    assert len(results) == 2

    results = BookService.search_books(None)
    assert len(results) == 2


def test_data_validation_and_constraints(fresh_db):
    """Test that data validation works correctly."""
    # Test creating book with all statuses
    for status in ReadingStatus:
        book_data = BookCreate(
            title=f"Book {status.value}", author=f"Author {status.value}", genre="Test", reading_status=status
        )
        created_book = BookService.create_book(book_data)
        assert created_book.reading_status == status

    # Test that timestamps are set correctly
    book_data = BookCreate(title="Time Test", author="Time Author", genre="Time")
    created_book = BookService.create_book(book_data)

    assert created_book.created_at is not None
    assert created_book.updated_at is not None
    # Timestamps should be very close but might differ slightly
    time_diff = abs((created_book.updated_at - created_book.created_at).total_seconds())
    assert time_diff < 1.0  # Less than 1 second difference

    # Test update changes timestamp
    import time

    time.sleep(0.1)  # Ensure timestamp difference

    updated_book = BookService.update_book(created_book.id, BookUpdate(title="Updated Title"))
    assert updated_book is not None
    assert updated_book.updated_at > updated_book.created_at


def test_concurrent_operations(fresh_db):
    """Test that concurrent operations work correctly."""
    # Create initial book
    book_data = BookCreate(title="Concurrent Test", author="Test Author", genre="Test")
    book = BookService.create_book(book_data)

    # Simulate concurrent reads
    book1 = BookService.get_book(book.id)
    book2 = BookService.get_book(book.id)

    assert book1 is not None
    assert book2 is not None
    assert book1.id == book2.id
    assert book1.title == book2.title

    # Test multiple updates don't interfere
    update1 = BookService.update_book(book.id, BookUpdate(genre="Updated Genre 1"))
    update2 = BookService.update_book(book.id, BookUpdate(author="Updated Author"))

    assert update1 is not None
    assert update2 is not None
    assert update2.genre == "Updated Genre 1"  # Should retain previous update
    assert update2.author == "Updated Author"  # Should have new update
