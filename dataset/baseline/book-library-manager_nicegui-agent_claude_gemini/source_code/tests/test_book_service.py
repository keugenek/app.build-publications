import pytest
from app.database import reset_db
from app.book_service import BookService
from app.models import BookCreate, BookUpdate, BookSearch, ReadingStatus


@pytest.fixture
def fresh_db():
    """Reset database for each test."""
    reset_db()
    yield
    reset_db()


def test_create_book(fresh_db):
    """Test creating a new book."""
    book_data = BookCreate(
        title="The Great Gatsby",
        author="F. Scott Fitzgerald",
        genre="Fiction",
        reading_status=ReadingStatus.WANT_TO_READ,
    )

    book = BookService.create_book(book_data)

    assert book.title == "The Great Gatsby"
    assert book.author == "F. Scott Fitzgerald"
    assert book.genre == "Fiction"
    assert book.reading_status == ReadingStatus.WANT_TO_READ
    assert book.id is not None
    assert book.created_at is not None


def test_get_book_existing(fresh_db):
    """Test retrieving an existing book."""
    # Create a book first
    book_data = BookCreate(title="1984", author="George Orwell", genre="Dystopian Fiction")
    created_book = BookService.create_book(book_data)

    # Retrieve the book
    retrieved_book = BookService.get_book(created_book.id)

    assert retrieved_book is not None
    assert retrieved_book.title == "1984"
    assert retrieved_book.author == "George Orwell"


def test_get_book_nonexistent(fresh_db):
    """Test retrieving a non-existent book returns None."""
    book = BookService.get_book(999)
    assert book is None


def test_update_book_existing(fresh_db):
    """Test updating an existing book."""
    # Create a book first
    book_data = BookCreate(title="Original Title", author="Original Author", genre="Original Genre")
    created_book = BookService.create_book(book_data)

    # Update the book
    update_data = BookUpdate(title="Updated Title", reading_status=ReadingStatus.READING)
    updated_book = BookService.update_book(created_book.id, update_data)

    assert updated_book is not None
    assert updated_book.title == "Updated Title"
    assert updated_book.author == "Original Author"  # Unchanged
    assert updated_book.genre == "Original Genre"  # Unchanged
    assert updated_book.reading_status == ReadingStatus.READING
    assert updated_book.updated_at > updated_book.created_at


def test_update_book_nonexistent(fresh_db):
    """Test updating a non-existent book returns None."""
    update_data = BookUpdate(title="New Title")
    result = BookService.update_book(999, update_data)
    assert result is None


def test_update_book_partial(fresh_db):
    """Test partial update of a book."""
    # Create a book
    book_data = BookCreate(
        title="Test Book", author="Test Author", genre="Test Genre", reading_status=ReadingStatus.WANT_TO_READ
    )
    created_book = BookService.create_book(book_data)

    # Update only the reading status
    update_data = BookUpdate(reading_status=ReadingStatus.READ)
    updated_book = BookService.update_book(created_book.id, update_data)

    assert updated_book is not None
    assert updated_book.title == "Test Book"  # Unchanged
    assert updated_book.reading_status == ReadingStatus.READ  # Changed


def test_delete_book_existing(fresh_db):
    """Test deleting an existing book."""
    # Create a book first
    book_data = BookCreate(title="To Delete", author="Delete Author", genre="Delete Genre")
    created_book = BookService.create_book(book_data)

    # Delete the book
    result = BookService.delete_book(created_book.id)
    assert result is True

    # Verify it's gone
    retrieved_book = BookService.get_book(created_book.id)
    assert retrieved_book is None


def test_delete_book_nonexistent(fresh_db):
    """Test deleting a non-existent book returns False."""
    result = BookService.delete_book(999)
    assert result is False


def test_search_books_by_title(fresh_db):
    """Test searching books by title."""
    # Create test books
    books_data = [
        BookCreate(title="The Great Gatsby", author="F. Scott Fitzgerald", genre="Fiction"),
        BookCreate(title="Great Expectations", author="Charles Dickens", genre="Fiction"),
        BookCreate(title="To Kill a Mockingbird", author="Harper Lee", genre="Fiction"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Search for books with "Great" in title
    search_params = BookSearch(query="Great")
    results = BookService.search_books(search_params)

    assert len(results) == 2
    titles = [book.title for book in results]
    assert "The Great Gatsby" in titles
    assert "Great Expectations" in titles


def test_search_books_by_author(fresh_db):
    """Test searching books by author."""
    # Create test books
    books_data = [
        BookCreate(title="1984", author="George Orwell", genre="Dystopian"),
        BookCreate(title="Animal Farm", author="George Orwell", genre="Allegory"),
        BookCreate(title="Brave New World", author="Aldous Huxley", genre="Dystopian"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Search for books by George Orwell
    search_params = BookSearch(query="George Orwell")
    results = BookService.search_books(search_params)

    assert len(results) == 2
    for book in results:
        assert book.author == "George Orwell"


def test_search_books_by_genre(fresh_db):
    """Test filtering books by genre."""
    # Create test books
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Science Fiction"),
        BookCreate(title="Book 2", author="Author 2", genre="Mystery"),
        BookCreate(title="Book 3", author="Author 3", genre="Science Fiction"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Filter by genre
    search_params = BookSearch(genre="Science Fiction")
    results = BookService.search_books(search_params)

    assert len(results) == 2
    for book in results:
        assert book.genre == "Science Fiction"


def test_search_books_by_reading_status(fresh_db):
    """Test filtering books by reading status."""
    # Create test books with different statuses
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Fiction", reading_status=ReadingStatus.READ),
        BookCreate(title="Book 2", author="Author 2", genre="Fiction", reading_status=ReadingStatus.READING),
        BookCreate(title="Book 3", author="Author 3", genre="Fiction", reading_status=ReadingStatus.READ),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Filter by reading status
    search_params = BookSearch(reading_status=ReadingStatus.READ)
    results = BookService.search_books(search_params)

    assert len(results) == 2
    for book in results:
        assert book.reading_status == ReadingStatus.READ


def test_search_books_combined_filters(fresh_db):
    """Test searching with multiple filters."""
    # Create test books
    books_data = [
        BookCreate(title="Science Book 1", author="Sci Author", genre="Science", reading_status=ReadingStatus.READ),
        BookCreate(
            title="Science Book 2", author="Another Author", genre="Science", reading_status=ReadingStatus.READING
        ),
        BookCreate(title="Fiction Book", author="Fiction Author", genre="Fiction", reading_status=ReadingStatus.READ),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Search with multiple filters
    search_params = BookSearch(query="Science", genre="Science", reading_status=ReadingStatus.READ)
    results = BookService.search_books(search_params)

    assert len(results) == 1
    assert results[0].title == "Science Book 1"


def test_get_all_books(fresh_db):
    """Test retrieving all books."""
    # Create test books
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Genre 1"),
        BookCreate(title="Book 2", author="Author 2", genre="Genre 2"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Get all books
    all_books = BookService.get_all_books()

    assert len(all_books) == 2


def test_get_genres(fresh_db):
    """Test retrieving all unique genres."""
    # Create books with various genres
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Fiction"),
        BookCreate(title="Book 2", author="Author 2", genre="Science Fiction"),
        BookCreate(title="Book 3", author="Author 3", genre="Fiction"),  # Duplicate genre
        BookCreate(title="Book 4", author="Author 4", genre="Mystery"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    genres = BookService.get_genres()

    assert len(genres) == 3  # Should be unique
    assert "Fiction" in genres
    assert "Science Fiction" in genres
    assert "Mystery" in genres


def test_get_book_count_by_status(fresh_db):
    """Test getting book counts by reading status."""
    # Create books with different statuses
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Fiction", reading_status=ReadingStatus.READ),
        BookCreate(title="Book 2", author="Author 2", genre="Fiction", reading_status=ReadingStatus.READ),
        BookCreate(title="Book 3", author="Author 3", genre="Fiction", reading_status=ReadingStatus.READING),
        BookCreate(title="Book 4", author="Author 4", genre="Fiction", reading_status=ReadingStatus.WANT_TO_READ),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    counts = BookService.get_book_count_by_status()

    assert counts[ReadingStatus.READ] == 2
    assert counts[ReadingStatus.READING] == 1
    assert counts[ReadingStatus.WANT_TO_READ] == 1


def test_search_case_insensitive(fresh_db):
    """Test that search is case insensitive."""
    book_data = BookCreate(title="The Great Gatsby", author="F. Scott Fitzgerald", genre="Fiction")
    BookService.create_book(book_data)

    # Test various case combinations
    search_params = BookSearch(query="great gatsby")
    results = BookService.search_books(search_params)
    assert len(results) == 1

    search_params = BookSearch(query="FITZGERALD")
    results = BookService.search_books(search_params)
    assert len(results) == 1


def test_search_empty_query(fresh_db):
    """Test search with empty parameters returns all books."""
    books_data = [
        BookCreate(title="Book 1", author="Author 1", genre="Fiction"),
        BookCreate(title="Book 2", author="Author 2", genre="Mystery"),
    ]

    for book_data in books_data:
        BookService.create_book(book_data)

    # Empty search should return all books
    results = BookService.search_books(BookSearch())
    assert len(results) == 2

    # None search should also return all books
    results = BookService.search_books(None)
    assert len(results) == 2
