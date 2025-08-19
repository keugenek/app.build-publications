import pytest
from app.auth_service import AuthService
from app.category_service import CategoryService
from app.notes_service import NotesService
from app.models import UserCreate, CategoryCreate, NoteCreate, NoteUpdate
from app.database import reset_db


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


@pytest.fixture()
def test_user(new_db):
    """Create a test user"""
    user_data = UserCreate(email="test@example.com", password="password123")
    user = AuthService.create_user(user_data)
    assert user is not None
    assert user.id is not None
    return user


@pytest.fixture()
def test_category(test_user):
    """Create a test category"""
    category_data = CategoryCreate(name="Test Category", color="#E3F2FD")
    category = CategoryService.create_category(test_user.id, category_data)
    assert category is not None
    assert category.id is not None
    return category


def test_create_note_success(test_user):
    """Test successful note creation"""
    note_data = NoteCreate(title="Test Note", content="This is a test note content", category_id=None)

    note = NotesService.create_note(test_user.id, note_data)

    assert note is not None
    assert note.id is not None
    assert note.title == "Test Note"
    assert note.content == "This is a test note content"
    assert note.category_id is None
    assert note.user_id == test_user.id
    assert not note.is_pinned


def test_create_note_with_category(test_user, test_category):
    """Test creating note with category"""
    note_data = NoteCreate(title="Categorized Note", content="Note with category", category_id=test_category.id)

    note = NotesService.create_note(test_user.id, note_data)

    assert note is not None
    assert note.category_id == test_category.id


def test_get_user_notes_empty(test_user):
    """Test getting notes when user has none"""
    notes = NotesService.get_user_notes(test_user.id)
    assert notes == []


def test_get_user_notes_with_data(test_user, test_category):
    """Test getting user notes with data"""
    # Create some notes
    note1_data = NoteCreate(title="Note 1", content="Content 1")
    note2_data = NoteCreate(title="Note 2", content="Content 2", category_id=test_category.id)
    note3_data = NoteCreate(title="Pinned Note", content="Pinned content")

    note1 = NotesService.create_note(test_user.id, note1_data)
    note2 = NotesService.create_note(test_user.id, note2_data)
    note3 = NotesService.create_note(test_user.id, note3_data)

    assert note1 is not None and note1.id is not None
    assert note2 is not None and note2.id is not None
    assert note3 is not None and note3.id is not None

    # Pin note3
    NotesService.update_note(note3.id, test_user.id, NoteUpdate(is_pinned=True))

    # Get all notes
    notes = NotesService.get_user_notes(test_user.id)
    assert len(notes) == 3

    # Should be ordered by pinned first, then by updated_at desc
    assert notes[0].title == "Pinned Note"  # Pinned note first
    assert notes[0].is_pinned


def test_get_user_notes_by_category(test_user, test_category):
    """Test getting notes filtered by category"""
    # Create notes with and without category
    note1_data = NoteCreate(title="Uncategorized", content="No category")
    note2_data = NoteCreate(title="Categorized", content="With category", category_id=test_category.id)

    NotesService.create_note(test_user.id, note1_data)
    NotesService.create_note(test_user.id, note2_data)

    # Get notes by category
    categorized_notes = NotesService.get_user_notes(test_user.id, test_category.id)
    assert len(categorized_notes) == 1
    assert categorized_notes[0].title == "Categorized"


def test_get_uncategorized_notes(test_user, test_category):
    """Test getting uncategorized notes"""
    # Create notes with and without category
    note1_data = NoteCreate(title="Uncategorized", content="No category")
    note2_data = NoteCreate(title="Categorized", content="With category", category_id=test_category.id)

    NotesService.create_note(test_user.id, note1_data)
    NotesService.create_note(test_user.id, note2_data)

    # Get uncategorized notes
    uncategorized_notes = NotesService.get_uncategorized_notes(test_user.id)
    assert len(uncategorized_notes) == 1
    assert uncategorized_notes[0].title == "Uncategorized"


def test_get_note_by_id(test_user):
    """Test getting note by ID"""
    # Create note
    note_data = NoteCreate(title="Test Note", content="Test content")
    created_note = NotesService.create_note(test_user.id, note_data)
    assert created_note is not None
    assert created_note.id is not None

    # Get by ID
    retrieved_note = NotesService.get_note_by_id(created_note.id, test_user.id)
    assert retrieved_note is not None
    assert retrieved_note.id == created_note.id
    assert retrieved_note.title == "Test Note"

    # Test with non-existent ID
    nonexistent_note = NotesService.get_note_by_id(99999, test_user.id)
    assert nonexistent_note is None


def test_get_note_by_id_wrong_user(test_user, new_db):
    """Test getting note by ID with wrong user"""
    # Create another user
    user2_data = UserCreate(email="user2@example.com", password="password123")
    user2 = AuthService.create_user(user2_data)
    assert user2 is not None
    assert user2.id is not None

    # Create note for user1
    note_data = NoteCreate(title="User1 Note", content="Content")
    note = NotesService.create_note(test_user.id, note_data)
    assert note is not None
    assert note.id is not None

    # Try to get note as user2
    retrieved_note = NotesService.get_note_by_id(note.id, user2.id)
    assert retrieved_note is None


def test_update_note(test_user, test_category):
    """Test updating note"""
    # Create note
    note_data = NoteCreate(title="Original Title", content="Original content")
    note = NotesService.create_note(test_user.id, note_data)
    assert note is not None
    assert note.id is not None

    # Update note
    update_data = NoteUpdate(
        title="Updated Title", content="Updated content", category_id=test_category.id, is_pinned=True
    )

    updated_note = NotesService.update_note(note.id, test_user.id, update_data)
    assert updated_note is not None
    assert updated_note.id == note.id
    assert updated_note.title == "Updated Title"
    assert updated_note.content == "Updated content"
    assert updated_note.category_id == test_category.id
    assert updated_note.is_pinned


def test_update_note_partial(test_user):
    """Test partial note update"""
    # Create note
    note_data = NoteCreate(title="Original Title", content="Original content")
    note = NotesService.create_note(test_user.id, note_data)
    assert note is not None
    assert note.id is not None

    # Update only title
    update_data = NoteUpdate(title="New Title")

    updated_note = NotesService.update_note(note.id, test_user.id, update_data)
    assert updated_note is not None
    assert updated_note.title == "New Title"
    assert updated_note.content == "Original content"  # Unchanged
    assert not updated_note.is_pinned  # Unchanged


def test_update_note_nonexistent(test_user):
    """Test updating non-existent note"""
    update_data = NoteUpdate(title="New Title")
    updated_note = NotesService.update_note(99999, test_user.id, update_data)
    assert updated_note is None


def test_delete_note(test_user):
    """Test deleting note"""
    # Create note
    note_data = NoteCreate(title="To Delete", content="Delete me")
    note = NotesService.create_note(test_user.id, note_data)
    assert note is not None
    assert note.id is not None

    # Delete note
    success = NotesService.delete_note(note.id, test_user.id)
    assert success

    # Verify it's deleted
    deleted_note = NotesService.get_note_by_id(note.id, test_user.id)
    assert deleted_note is None


def test_delete_note_nonexistent(test_user):
    """Test deleting non-existent note"""
    success = NotesService.delete_note(99999, test_user.id)
    assert not success


def test_search_notes(test_user):
    """Test searching notes"""
    # Create notes with different content
    notes_data = [
        NoteCreate(title="Python Tutorial", content="Learn Python programming"),
        NoteCreate(title="Shopping List", content="Buy milk, bread, and eggs"),
        NoteCreate(title="Meeting Notes", content="Python project discussion"),
        NoteCreate(title="Recipe", content="How to make pasta"),
    ]

    for note_data in notes_data:
        NotesService.create_note(test_user.id, note_data)

    # Search by title
    python_notes = NotesService.search_notes(test_user.id, "Python")
    assert len(python_notes) == 2  # "Python Tutorial" and "Meeting Notes" (contains "Python")

    # Search by content
    milk_notes = NotesService.search_notes(test_user.id, "milk")
    assert len(milk_notes) == 1
    assert milk_notes[0].title == "Shopping List"

    # Search with no results
    no_results = NotesService.search_notes(test_user.id, "nonexistent")
    assert len(no_results) == 0


def test_search_notes_empty(test_user):
    """Test searching notes when none exist"""
    results = NotesService.search_notes(test_user.id, "anything")
    assert results == []
