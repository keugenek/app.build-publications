import pytest
from nicegui.testing import User
from app.database import reset_db
from app.auth_service import AuthService
from app.models import UserCreate


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
    return user


async def test_login_page_loads(user: User) -> None:
    """Test that login page loads correctly"""
    await user.open("/login")
    await user.should_see("Welcome Back")
    await user.should_see("Sign in to your notes")


async def test_register_page_loads(user: User) -> None:
    """Test that register page loads correctly"""
    await user.open("/register")
    await user.should_see("Create Account")
    await user.should_see("Join to start organizing your notes")


async def test_successful_login_redirect(user: User, test_user) -> None:
    """Test successful login redirects to dashboard"""
    await user.open("/login")

    # Find and fill login form
    user.find("Email").type("test@example.com")
    user.find("Password").type("password123")
    user.find("Sign In").click()

    # Should redirect to dashboard
    await user.should_see("Notes App")
    await user.should_see("All Notes")


async def test_failed_login_shows_error(user: User) -> None:
    """Test failed login shows error message"""
    await user.open("/login")

    # Try login with wrong credentials
    user.find("Email").type("wrong@email.com")
    user.find("Password").type("wrongpassword")
    user.find("Sign In").click()

    await user.should_see("Invalid email or password")


async def test_register_validation(user: User) -> None:
    """Test register form validation"""
    await user.open("/register")

    # Try to register with empty fields
    user.find("Create Account").click()
    await user.should_see("Please fill in all fields")

    # Try mismatched passwords
    user.find("Email").type("test@example.com")
    user.find("Password").type("password123")
    user.find("Confirm Password").type("different")
    user.find("Create Account").click()

    await user.should_see("Passwords do not match")


async def test_dashboard_requires_auth(user: User) -> None:
    """Test that dashboard requires authentication"""
    await user.open("/dashboard")
    # Should redirect to login
    await user.should_see("Welcome Back")


async def test_dashboard_with_auth(user: User, test_user) -> None:
    """Test dashboard loads when authenticated"""
    # Login through the UI flow instead of directly setting storage
    await user.open("/login")

    # Fill login form
    user.find("Email").type("test@example.com")
    user.find("Password").type("password123")
    user.find("Sign In").click()

    # Should be redirected to dashboard
    await user.should_see("Notes App")
    await user.should_see("All Notes")
    await user.should_see("New Note")


async def test_root_redirect_when_authenticated(user: User, test_user) -> None:
    """Test root redirects to dashboard when authenticated"""
    # Login first
    await user.open("/login")
    user.find("Email").type("test@example.com")
    user.find("Password").type("password123")
    user.find("Sign In").click()

    # Now test root redirect
    await user.open("/")
    await user.should_see("Notes App")


async def test_root_redirect_when_not_authenticated(user: User) -> None:
    """Test root redirects to login when not authenticated"""
    await user.open("/")
    await user.should_see("Welcome Back")
