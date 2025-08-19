from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from enum import Enum


# Enums for transaction types and budget periods
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class BudgetPeriod(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Default currency for user's transactions
    default_currency: str = Field(default="USD", max_length=3)

    # Relationships
    categories: List["Category"] = Relationship(back_populates="user")
    transactions: List["Transaction"] = Relationship(back_populates="user")
    budgets: List["Budget"] = Relationship(back_populates="user")


class Category(SQLModel, table=True):
    __tablename__ = "categories"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    color: str = Field(default="#3B82F6", max_length=7)  # Hex color code
    icon: str = Field(default="💰", max_length=10)  # Emoji or icon identifier
    is_active: bool = Field(default=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="categories")
    transactions: List["Transaction"] = Relationship(back_populates="category")
    budgets: List["Budget"] = Relationship(back_populates="category")


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    description: str = Field(max_length=500)
    amount: Decimal = Field(decimal_places=2, max_digits=12)
    transaction_type: TransactionType
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    currency: str = Field(default="USD", max_length=3)

    # Optional fields
    notes: str = Field(default="", max_length=1000)
    receipt_url: Optional[str] = Field(default=None, max_length=500)
    tags: List[str] = Field(default=[], sa_column=Column(JSON))

    # Foreign keys
    user_id: int = Field(foreign_key="users.id")
    category_id: int = Field(foreign_key="categories.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="transactions")
    category: Category = Relationship(back_populates="transactions")


class Budget(SQLModel, table=True):
    __tablename__ = "budgets"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    amount: Decimal = Field(decimal_places=2, max_digits=12)
    period: BudgetPeriod = Field(default=BudgetPeriod.MONTHLY)
    currency: str = Field(default="USD", max_length=3)

    # Date range for budget
    start_date: datetime
    end_date: datetime

    # Status and alerts
    is_active: bool = Field(default=True)
    alert_threshold: Decimal = Field(default=Decimal("80.0"), decimal_places=2, max_digits=5)  # Percentage

    # Foreign keys
    user_id: int = Field(foreign_key="users.id")
    category_id: int = Field(foreign_key="categories.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="budgets")
    category: Category = Relationship(back_populates="budgets")


class DashboardSnapshot(SQLModel, table=True):
    __tablename__ = "dashboard_snapshots"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    snapshot_date: datetime = Field(default_factory=datetime.utcnow)

    # Aggregated data for dashboard
    total_income: Decimal = Field(default=Decimal("0.0"), decimal_places=2, max_digits=12)
    total_expenses: Decimal = Field(default=Decimal("0.0"), decimal_places=2, max_digits=12)
    net_balance: Decimal = Field(default=Decimal("0.0"), decimal_places=2, max_digits=12)

    # Category breakdown
    category_spending: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    monthly_trends: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    budget_status: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    default_currency: str = Field(default="USD", max_length=3)


class UserUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    default_currency: Optional[str] = Field(default=None, max_length=3)
    is_active: Optional[bool] = Field(default=None)


class CategoryCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    color: str = Field(default="#3B82F6", max_length=7)
    icon: str = Field(default="💰", max_length=10)
    user_id: int


class CategoryUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    color: Optional[str] = Field(default=None, max_length=7)
    icon: Optional[str] = Field(default=None, max_length=10)
    is_active: Optional[bool] = Field(default=None)


class TransactionCreate(SQLModel, table=False):
    description: str = Field(max_length=500)
    amount: Decimal = Field(decimal_places=2, max_digits=12)
    transaction_type: TransactionType
    transaction_date: datetime
    currency: str = Field(default="USD", max_length=3)
    notes: str = Field(default="", max_length=1000)
    receipt_url: Optional[str] = Field(default=None, max_length=500)
    tags: List[str] = Field(default=[])
    user_id: int
    category_id: int


class TransactionUpdate(SQLModel, table=False):
    description: Optional[str] = Field(default=None, max_length=500)
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=12)
    transaction_type: Optional[TransactionType] = Field(default=None)
    transaction_date: Optional[datetime] = Field(default=None)
    currency: Optional[str] = Field(default=None, max_length=3)
    notes: Optional[str] = Field(default=None, max_length=1000)
    receipt_url: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[List[str]] = Field(default=None)
    category_id: Optional[int] = Field(default=None)


class BudgetCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    amount: Decimal = Field(decimal_places=2, max_digits=12)
    period: BudgetPeriod = Field(default=BudgetPeriod.MONTHLY)
    currency: str = Field(default="USD", max_length=3)
    start_date: datetime
    end_date: datetime
    alert_threshold: Decimal = Field(default=Decimal("80.0"), decimal_places=2, max_digits=5)
    user_id: int
    category_id: int


class BudgetUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=12)
    period: Optional[BudgetPeriod] = Field(default=None)
    currency: Optional[str] = Field(default=None, max_length=3)
    start_date: Optional[datetime] = Field(default=None)
    end_date: Optional[datetime] = Field(default=None)
    alert_threshold: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=5)
    is_active: Optional[bool] = Field(default=None)
    category_id: Optional[int] = Field(default=None)


class DashboardData(SQLModel, table=False):
    total_income: Decimal
    total_expenses: Decimal
    net_balance: Decimal
    category_spending: Dict[str, Any]
    monthly_trends: Dict[str, Any]
    budget_status: Dict[str, Any]
    recent_transactions: List[Dict[str, Any]]
    budget_alerts: List[Dict[str, Any]]


class TransactionFilters(SQLModel, table=False):
    start_date: Optional[datetime] = Field(default=None)
    end_date: Optional[datetime] = Field(default=None)
    transaction_type: Optional[TransactionType] = Field(default=None)
    category_ids: Optional[List[int]] = Field(default=None)
    min_amount: Optional[Decimal] = Field(default=None)
    max_amount: Optional[Decimal] = Field(default=None)
    tags: Optional[List[str]] = Field(default=None)
