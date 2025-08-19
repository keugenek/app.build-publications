import hashlib
import secrets
from typing import Optional
from datetime import datetime
from sqlmodel import select
from app.database import get_session
from app.models import User, UserCreate, UserLogin


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using SHA-256 with random salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{password_hash}"

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against stored hash"""
        try:
            salt, stored_hash = password_hash.split(":", 1)
            computed_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return computed_hash == stored_hash
        except ValueError as e:
            import logging

            logging.info(f"Password verification failed: invalid hash format: {e}")
            return False

    @staticmethod
    def create_user(user_data: UserCreate) -> Optional[User]:
        """Create a new user account"""
        with get_session() as session:
            # Check if user already exists
            existing_user = session.exec(select(User).where(User.email == user_data.email)).first()

            if existing_user:
                return None

            # Create new user
            password_hash = AuthService.hash_password(user_data.password)
            user = User(
                email=user_data.email,
                password_hash=password_hash,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    @staticmethod
    def authenticate_user(login_data: UserLogin) -> Optional[User]:
        """Authenticate user with email and password"""
        with get_session() as session:
            user = session.exec(select(User).where(User.email == login_data.email)).first()

            if user is None:
                return None

            if not user.is_active:
                return None

            if not AuthService.verify_password(login_data.password, user.password_hash):
                return None

            return user

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        with get_session() as session:
            return session.get(User, user_id)

    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        with get_session() as session:
            return session.exec(select(User).where(User.email == email)).first()
