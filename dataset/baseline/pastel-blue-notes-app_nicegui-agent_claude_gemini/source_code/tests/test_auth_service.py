import pytest
from app.auth_service import AuthService
from app.models import UserCreate, UserLogin
from app.database import reset_db


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


def test_hash_password():
    """Test password hashing functionality"""
    password = "test_password_123"
    hashed = AuthService.hash_password(password)

    # Should contain salt and hash separated by colon
    assert ":" in hashed
    salt, hash_part = hashed.split(":", 1)
    assert len(salt) == 32  # 16 bytes hex = 32 chars
    assert len(hash_part) == 64  # SHA-256 = 64 hex chars

    # Same password should produce different hashes due to random salt
    hashed2 = AuthService.hash_password(password)
    assert hashed != hashed2


def test_verify_password():
    """Test password verification"""
    password = "test_password_123"
    hashed = AuthService.hash_password(password)

    # Correct password should verify
    assert AuthService.verify_password(password, hashed)

    # Wrong password should not verify
    assert not AuthService.verify_password("wrong_password", hashed)

    # Invalid hash format should not verify
    assert not AuthService.verify_password(password, "invalid_hash")


def test_create_user_success(new_db):
    """Test successful user creation"""
    user_data = UserCreate(email="test@example.com", password="password123")
    user = AuthService.create_user(user_data)

    assert user is not None
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active
    assert AuthService.verify_password("password123", user.password_hash)


def test_create_user_duplicate_email(new_db):
    """Test creating user with duplicate email"""
    user_data = UserCreate(email="test@example.com", password="password123")

    # Create first user
    first_user = AuthService.create_user(user_data)
    assert first_user is not None

    # Try to create second user with same email
    second_user = AuthService.create_user(user_data)
    assert second_user is None


def test_authenticate_user_success(new_db):
    """Test successful user authentication"""
    # Create user first
    user_data = UserCreate(email="test@example.com", password="password123")
    created_user = AuthService.create_user(user_data)
    assert created_user is not None

    # Authenticate with correct credentials
    login_data = UserLogin(email="test@example.com", password="password123")
    authenticated_user = AuthService.authenticate_user(login_data)

    assert authenticated_user is not None
    assert authenticated_user.id == created_user.id
    assert authenticated_user.email == "test@example.com"


def test_authenticate_user_wrong_password(new_db):
    """Test authentication with wrong password"""
    # Create user first
    user_data = UserCreate(email="test@example.com", password="password123")
    AuthService.create_user(user_data)

    # Try to authenticate with wrong password
    login_data = UserLogin(email="test@example.com", password="wrong_password")
    authenticated_user = AuthService.authenticate_user(login_data)

    assert authenticated_user is None


def test_authenticate_user_nonexistent(new_db):
    """Test authentication with non-existent user"""
    login_data = UserLogin(email="nonexistent@example.com", password="password123")
    authenticated_user = AuthService.authenticate_user(login_data)

    assert authenticated_user is None


def test_get_user_by_id(new_db):
    """Test getting user by ID"""
    # Create user first
    user_data = UserCreate(email="test@example.com", password="password123")
    created_user = AuthService.create_user(user_data)
    assert created_user is not None
    assert created_user.id is not None

    # Get user by ID
    retrieved_user = AuthService.get_user_by_id(created_user.id)
    assert retrieved_user is not None
    assert retrieved_user.id == created_user.id
    assert retrieved_user.email == "test@example.com"

    # Test with non-existent ID
    nonexistent_user = AuthService.get_user_by_id(99999)
    assert nonexistent_user is None


def test_get_user_by_email(new_db):
    """Test getting user by email"""
    # Create user first
    user_data = UserCreate(email="test@example.com", password="password123")
    created_user = AuthService.create_user(user_data)
    assert created_user is not None

    # Get user by email
    retrieved_user = AuthService.get_user_by_email("test@example.com")
    assert retrieved_user is not None
    assert retrieved_user.email == "test@example.com"
    assert retrieved_user.id == created_user.id

    # Test with non-existent email
    nonexistent_user = AuthService.get_user_by_email("nonexistent@example.com")
    assert nonexistent_user is None
