from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


# Persistent models (stored in database)
class Product(SQLModel, table=True):
    __tablename__ = "products"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, index=True)
    sku: str = Field(unique=True, max_length=100, index=True)
    current_stock: Decimal = Field(default=Decimal("0"), ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    stock_in_transactions: List["StockInTransaction"] = Relationship(back_populates="product")
    stock_out_transactions: List["StockOutTransaction"] = Relationship(back_populates="product")


class StockInTransaction(SQLModel, table=True):
    __tablename__ = "stock_in_transactions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    quantity: Decimal = Field(gt=0)  # Must be positive
    unit_cost: Optional[Decimal] = Field(default=None, ge=0)  # Optional cost per unit
    supplier: Optional[str] = Field(default=None, max_length=200)
    reference_number: Optional[str] = Field(default=None, max_length=100)  # PO number, invoice, etc.
    notes: Optional[str] = Field(default=None, max_length=500)
    transaction_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    product: Product = Relationship(back_populates="stock_in_transactions")


class StockOutTransaction(SQLModel, table=True):
    __tablename__ = "stock_out_transactions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    quantity: Decimal = Field(gt=0)  # Must be positive
    reason: str = Field(max_length=100, default="Sale")  # Sale, Damage, Loss, etc.
    reference_number: Optional[str] = Field(default=None, max_length=100)  # Order number, etc.
    notes: Optional[str] = Field(default=None, max_length=500)
    transaction_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    product: Product = Relationship(back_populates="stock_out_transactions")


# Non-persistent schemas (for validation, forms, API requests/responses)
class ProductCreate(SQLModel, table=False):
    name: str = Field(max_length=200)
    sku: str = Field(max_length=100)
    current_stock: Decimal = Field(default=Decimal("0"), ge=0)


class ProductUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=200)
    sku: Optional[str] = Field(default=None, max_length=100)
    current_stock: Optional[Decimal] = Field(default=None, ge=0)


class StockInTransactionCreate(SQLModel, table=False):
    product_id: int
    quantity: Decimal = Field(gt=0)
    unit_cost: Optional[Decimal] = Field(default=None, ge=0)
    supplier: Optional[str] = Field(default=None, max_length=200)
    reference_number: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=500)
    transaction_date: Optional[datetime] = Field(default=None)


class StockOutTransactionCreate(SQLModel, table=False):
    product_id: int
    quantity: Decimal = Field(gt=0)
    reason: str = Field(max_length=100, default="Sale")
    reference_number: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=500)
    transaction_date: Optional[datetime] = Field(default=None)
