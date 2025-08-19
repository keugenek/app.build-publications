from typing import List, Optional
from datetime import datetime
from sqlmodel import select
from app.database import get_session
from app.models import Category, CategoryCreate, CategoryUpdate


class CategoryService:
    @staticmethod
    def create_category(user_id: int, category_data: CategoryCreate) -> Optional[Category]:
        """Create a new category for the user"""
        with get_session() as session:
            category = Category(
                name=category_data.name,
                description=category_data.description,
                color=category_data.color,
                user_id=user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(category)
            session.commit()
            session.refresh(category)
            return category

    @staticmethod
    def get_user_categories(user_id: int) -> List[Category]:
        """Get all categories for a user"""
        with get_session() as session:
            categories = session.exec(select(Category).where(Category.user_id == user_id).order_by(Category.name)).all()
            return list(categories)

    @staticmethod
    def get_category_by_id(category_id: int, user_id: int) -> Optional[Category]:
        """Get category by ID, ensuring it belongs to the user"""
        with get_session() as session:
            return session.exec(select(Category).where(Category.id == category_id, Category.user_id == user_id)).first()

    @staticmethod
    def update_category(category_id: int, user_id: int, update_data: CategoryUpdate) -> Optional[Category]:
        """Update a category"""
        with get_session() as session:
            category = session.exec(
                select(Category).where(Category.id == category_id, Category.user_id == user_id)
            ).first()

            if category is None:
                return None

            # Update fields that are not None
            if update_data.name is not None:
                category.name = update_data.name
            if update_data.description is not None:
                category.description = update_data.description
            if update_data.color is not None:
                category.color = update_data.color

            category.updated_at = datetime.utcnow()

            session.add(category)
            session.commit()
            session.refresh(category)
            return category

    @staticmethod
    def delete_category(category_id: int, user_id: int) -> bool:
        """Delete a category (this will set notes in this category to uncategorized)"""
        with get_session() as session:
            category = session.exec(
                select(Category).where(Category.id == category_id, Category.user_id == user_id)
            ).first()

            if category is None:
                return False

            # Notes in this category will automatically have category_id set to None
            # due to foreign key constraint handling
            session.delete(category)
            session.commit()
            return True
