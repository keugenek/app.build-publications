import pytest
from app.auth_service import AuthService
from app.category_service import CategoryService
from app.models import UserCreate, CategoryCreate, CategoryUpdate
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


def test_create_category_success(test_user):
    """Test successful category creation"""
    category_data = CategoryCreate(name="Work", description="Work-related notes", color="#E3F2FD")

    category = CategoryService.create_category(test_user.id, category_data)

    assert category is not None
    assert category.id is not None
    assert category.name == "Work"
    assert category.description == "Work-related notes"
    assert category.color == "#E3F2FD"
    assert category.user_id == test_user.id


def test_get_user_categories(test_user):
    """Test getting user categories"""
    # Initially empty
    categories = CategoryService.get_user_categories(test_user.id)
    assert categories == []

    # Create some categories
    cat1_data = CategoryCreate(name="Work", description="Work notes", color="#E3F2FD")
    cat2_data = CategoryCreate(name="Personal", description="Personal notes", color="#F3E5F5")

    cat1 = CategoryService.create_category(test_user.id, cat1_data)
    cat2 = CategoryService.create_category(test_user.id, cat2_data)

    assert cat1 is not None
    assert cat2 is not None

    # Get categories
    categories = CategoryService.get_user_categories(test_user.id)
    assert len(categories) == 2

    # Should be sorted by name
    assert categories[0].name == "Personal"
    assert categories[1].name == "Work"


def test_get_category_by_id(test_user):
    """Test getting category by ID"""
    # Create category
    category_data = CategoryCreate(name="Test Category", color="#E3F2FD")
    created_category = CategoryService.create_category(test_user.id, category_data)
    assert created_category is not None
    assert created_category.id is not None

    # Get by ID
    retrieved_category = CategoryService.get_category_by_id(created_category.id, test_user.id)
    assert retrieved_category is not None
    assert retrieved_category.id == created_category.id
    assert retrieved_category.name == "Test Category"

    # Test with non-existent ID
    nonexistent_category = CategoryService.get_category_by_id(99999, test_user.id)
    assert nonexistent_category is None


def test_get_category_by_id_wrong_user(test_user, new_db):
    """Test getting category by ID with wrong user"""
    # Create another user
    user2_data = UserCreate(email="user2@example.com", password="password123")
    user2 = AuthService.create_user(user2_data)
    assert user2 is not None
    assert user2.id is not None

    # Create category for user1
    category_data = CategoryCreate(name="User1 Category", color="#E3F2FD")
    category = CategoryService.create_category(test_user.id, category_data)
    assert category is not None
    assert category.id is not None

    # Try to get category as user2
    retrieved_category = CategoryService.get_category_by_id(category.id, user2.id)
    assert retrieved_category is None


def test_update_category(test_user):
    """Test updating category"""
    # Create category
    category_data = CategoryCreate(name="Original Name", description="Original desc", color="#E3F2FD")
    category = CategoryService.create_category(test_user.id, category_data)
    assert category is not None
    assert category.id is not None

    # Update category
    update_data = CategoryUpdate(name="Updated Name", description="Updated description", color="#F3E5F5")

    updated_category = CategoryService.update_category(category.id, test_user.id, update_data)
    assert updated_category is not None
    assert updated_category.id == category.id
    assert updated_category.name == "Updated Name"
    assert updated_category.description == "Updated description"
    assert updated_category.color == "#F3E5F5"


def test_update_category_partial(test_user):
    """Test partial category update"""
    # Create category
    category_data = CategoryCreate(name="Original Name", description="Original desc", color="#E3F2FD")
    category = CategoryService.create_category(test_user.id, category_data)
    assert category is not None
    assert category.id is not None

    # Update only name
    update_data = CategoryUpdate(name="New Name")

    updated_category = CategoryService.update_category(category.id, test_user.id, update_data)
    assert updated_category is not None
    assert updated_category.name == "New Name"
    assert updated_category.description == "Original desc"  # Unchanged
    assert updated_category.color == "#E3F2FD"  # Unchanged


def test_update_category_nonexistent(test_user):
    """Test updating non-existent category"""
    update_data = CategoryUpdate(name="New Name")
    updated_category = CategoryService.update_category(99999, test_user.id, update_data)
    assert updated_category is None


def test_delete_category(test_user):
    """Test deleting category"""
    # Create category
    category_data = CategoryCreate(name="To Delete", color="#E3F2FD")
    category = CategoryService.create_category(test_user.id, category_data)
    assert category is not None
    assert category.id is not None

    # Delete category
    success = CategoryService.delete_category(category.id, test_user.id)
    assert success

    # Verify it's deleted
    deleted_category = CategoryService.get_category_by_id(category.id, test_user.id)
    assert deleted_category is None


def test_delete_category_nonexistent(test_user):
    """Test deleting non-existent category"""
    success = CategoryService.delete_category(99999, test_user.id)
    assert not success
