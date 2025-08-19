"""Simple integration tests focusing on service layer functionality."""

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


def test_book_library_service_integration(fresh_db):
    """Test the complete book library workflow through service layer."""

    # Test 1: Empty library
    books = BookService.get_all_books()
    assert len(books) == 0

    stats = BookService.get_book_count_by_status()
    assert all(count == 0 for count in stats.values())

    # Test 2: Add books
    test_books = [
        BookCreate(
            title="The Great Gatsby",
            author="F. Scott Fitzgerald",
            genre="Fiction",
            reading_status=ReadingStatus.WANT_TO_READ,
        ),
        BookCreate(
            title="1984", author="George Orwell", genre="Dystopian Fiction", reading_status=ReadingStatus.READING
        ),
        BookCreate(
            title="To Kill a Mockingbird", author="Harper Lee", genre="Fiction", reading_status=ReadingStatus.READ
        ),
        BookCreate(
            title="The Catcher in the Rye", author="J.D. Salinger", genre="Fiction", reading_status=ReadingStatus.READ
        ),
    ]

    created_books = []
    for book_data in test_books:
        created_book = BookService.create_book(book_data)
        created_books.append(created_book)
        assert created_book.title == book_data.title
        assert created_book.author == book_data.author
        assert created_book.genre == book_data.genre
        assert created_book.reading_status == book_data.reading_status

    # Test 3: Verify all books are stored
    all_books = BookService.get_all_books()
    assert len(all_books) == 4

    # Test 4: Check statistics
    stats = BookService.get_book_count_by_status()
    assert stats[ReadingStatus.READ] == 2
    assert stats[ReadingStatus.READING] == 1
    assert stats[ReadingStatus.WANT_TO_READ] == 1

    # Test 5: Genre functionality
    genres = BookService.get_genres()
    assert "Fiction" in genres
    assert "Dystopian Fiction" in genres
    # Note: might be more genres due to updates in test 7
    assert len(genres) >= 2

    # Test 6: Search functionality
    # Search by title
    gatsby_results = BookService.search_books(BookSearch(query="Gatsby"))
    assert len(gatsby_results) == 1
    assert gatsby_results[0].title == "The Great Gatsby"

    # Search by author (case insensitive)
    orwell_results = BookService.search_books(BookSearch(query="orwell"))
    assert len(orwell_results) == 1
    assert orwell_results[0].author == "George Orwell"

    # Filter by genre
    fiction_results = BookService.search_books(BookSearch(genre="Fiction"))
    # Should find books with genre exactly "Fiction" (case-insensitive partial match)
    fiction_titles = [book.title for book in fiction_results]
    expected_titles = ["To Kill a Mockingbird", "The Catcher in the Rye"]
    for title in expected_titles:
        assert title in fiction_titles

    # Filter by reading status
    read_results = BookService.search_books(BookSearch(reading_status=ReadingStatus.READ))
    assert len(read_results) == 2

    # Combined search
    fiction_read_results = BookService.search_books(BookSearch(genre="Fiction", reading_status=ReadingStatus.READ))
    assert len(fiction_read_results) == 2
    fiction_read_titles = [book.title for book in fiction_read_results]
    assert "To Kill a Mockingbird" in fiction_read_titles
    assert "The Catcher in the Rye" in fiction_read_titles

    # Test 7: Update book
    gatsby_book = gatsby_results[0]
    updated_book = BookService.update_book(
        gatsby_book.id, BookUpdate(reading_status=ReadingStatus.READ, genre="American Literature")
    )

    assert updated_book is not None
    assert updated_book.reading_status == ReadingStatus.READ
    assert updated_book.genre == "American Literature"
    assert updated_book.title == "The Great Gatsby"  # Unchanged
    assert updated_book.author == "F. Scott Fitzgerald"  # Unchanged

    # Verify updated stats
    stats = BookService.get_book_count_by_status()
    assert stats[ReadingStatus.READ] == 3
    assert stats[ReadingStatus.WANT_TO_READ] == 0

    # Test 8: Delete book
    success = BookService.delete_book(gatsby_book.id)
    assert success is True

    # Verify deletion
    deleted_book = BookService.get_book(gatsby_book.id)
    assert deleted_book is None

    remaining_books = BookService.get_all_books()
    assert len(remaining_books) == 3

    # Test 9: Error cases
    # Get non-existent book
    non_existent = BookService.get_book(99999)
    assert non_existent is None

    # Update non-existent book
    update_result = BookService.update_book(99999, BookUpdate(title="New Title"))
    assert update_result is None

    # Delete non-existent book
    delete_result = BookService.delete_book(99999)
    assert delete_result is False

    # Test 10: Empty search returns all books
    all_search_results = BookService.search_books(BookSearch())
    assert len(all_search_results) == 3

    none_search_results = BookService.search_books(None)
    assert len(none_search_results) == 3


def test_book_search_edge_cases(fresh_db):
    """Test edge cases in book search functionality."""

    # Create books with various characteristics
    books = [
        BookCreate(title="Python Programming", author="John Doe", genre="Technology"),
        BookCreate(title="Advanced Python", author="Jane Smith", genre="Technology"),
        BookCreate(title="The Art of War", author="Sun Tzu", genre="Philosophy"),
        BookCreate(title="War and Peace", author="Leo Tolstoy", genre="Literature"),
    ]

    for book in books:
        BookService.create_book(book)

    # Test partial word matching
    python_results = BookService.search_books(BookSearch(query="Python"))
    assert len(python_results) == 2

    # Test multi-word search
    war_results = BookService.search_books(BookSearch(query="War"))
    assert len(war_results) == 2

    # Test case insensitive genre search
    tech_results = BookService.search_books(BookSearch(genre="technology"))
    assert len(tech_results) == 2

    # Test no matches
    no_results = BookService.search_books(BookSearch(query="NonExistent"))
    assert len(no_results) == 0

    # Test empty genre filter
    all_results = BookService.search_books(BookSearch(genre=""))
    assert len(all_results) == 4


def test_book_creation_and_validation(fresh_db):
    """Test book creation with various input scenarios."""

    # Test creation with minimum required fields
    simple_book = BookCreate(
        title="Simple Book",
        author="Simple Author",
        genre="Simple Genre",
        # reading_status should default to WANT_TO_READ
    )

    created_book = BookService.create_book(simple_book)
    assert created_book.reading_status == ReadingStatus.WANT_TO_READ

    # Test creation with all fields specified
    detailed_book = BookCreate(
        title="Detailed Book", author="Detailed Author", genre="Detailed Genre", reading_status=ReadingStatus.READING
    )

    created_detailed = BookService.create_book(detailed_book)
    assert created_detailed.reading_status == ReadingStatus.READING

    # Test that timestamps are properly set
    assert created_book.created_at is not None
    assert created_book.updated_at is not None
    assert created_detailed.created_at is not None
    assert created_detailed.updated_at is not None


def test_book_update_scenarios(fresh_db):
    """Test various book update scenarios."""

    # Create initial book
    book_data = BookCreate(
        title="Original Title",
        author="Original Author",
        genre="Original Genre",
        reading_status=ReadingStatus.WANT_TO_READ,
    )

    book = BookService.create_book(book_data)
    original_updated_at = book.updated_at

    # Test updating single field
    updated_book = BookService.update_book(book.id, BookUpdate(title="New Title"))
    assert updated_book is not None
    assert updated_book.title == "New Title"
    assert updated_book.author == "Original Author"  # Unchanged
    assert updated_book.genre == "Original Genre"  # Unchanged
    assert updated_book.reading_status == ReadingStatus.WANT_TO_READ  # Unchanged
    assert updated_book.updated_at > original_updated_at

    # Test updating multiple fields
    multi_update = BookService.update_book(book.id, BookUpdate(author="New Author", reading_status=ReadingStatus.READ))
    assert multi_update is not None
    assert multi_update.title == "New Title"  # From previous update
    assert multi_update.author == "New Author"  # Updated
    assert multi_update.genre == "Original Genre"  # Unchanged
    assert multi_update.reading_status == ReadingStatus.READ  # Updated

    # Test updating with None values (should not change anything)
    no_change_update = BookService.update_book(book.id, BookUpdate())
    assert no_change_update is not None
    assert no_change_update.title == "New Title"
    assert no_change_update.author == "New Author"
    assert no_change_update.genre == "Original Genre"
    assert no_change_update.reading_status == ReadingStatus.READ
