from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal


# Persistent models (stored in database)


class User(SQLModel, table=True):
    """User model for CMS authentication and authorization"""

    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=255, unique=True, index=True)
    full_name: str = Field(max_length=100)
    is_admin: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    reviews: List["Review"] = Relationship(back_populates="author")


class Category(SQLModel, table=True):
    """Product categories for organizing reviews"""

    __tablename__ = "categories"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True, index=True)
    slug: str = Field(max_length=100, unique=True, index=True)
    description: str = Field(max_length=500, default="")
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    products: List["Product"] = Relationship(back_populates="category")


class Brand(SQLModel, table=True):
    """Brand/manufacturer information"""

    __tablename__ = "brands"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True, index=True)
    slug: str = Field(max_length=100, unique=True, index=True)
    description: str = Field(max_length=500, default="")
    website_url: str = Field(max_length=500, default="")
    logo_url: str = Field(max_length=500, default="")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    products: List["Product"] = Relationship(back_populates="brand")


class Product(SQLModel, table=True):
    """Products being reviewed"""

    __tablename__ = "products"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, index=True)
    slug: str = Field(max_length=200, unique=True, index=True)
    model_number: str = Field(max_length=100, default="")
    brand_id: int = Field(foreign_key="brands.id", index=True)
    category_id: int = Field(foreign_key="categories.id", index=True)
    msrp_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    current_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    purchase_url: str = Field(max_length=500, default="")
    affiliate_url: str = Field(max_length=500, default="")
    specs: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    features: List[str] = Field(default=[], sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    brand: Brand = Relationship(back_populates="products")
    category: Category = Relationship(back_populates="products")
    reviews: List["Review"] = Relationship(back_populates="product")
    images: List["ProductImage"] = Relationship(back_populates="product", cascade_delete=True)


class Review(SQLModel, table=True):
    """Review articles for products"""

    __tablename__ = "reviews"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, index=True)
    slug: str = Field(max_length=200, unique=True, index=True)
    summary: str = Field(max_length=500, default="")
    content: str = Field()  # Full review content
    rating: Decimal = Field(decimal_places=1, max_digits=2, ge=0.0, le=5.0)
    pros: List[str] = Field(default=[], sa_column=Column(JSON))
    cons: List[str] = Field(default=[], sa_column=Column(JSON))

    # Meta information
    is_published: bool = Field(default=False)
    is_featured: bool = Field(default=False)
    view_count: int = Field(default=0)
    published_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign keys
    product_id: int = Field(foreign_key="products.id", index=True)
    author_id: int = Field(foreign_key="users.id", index=True)

    # Relationships
    product: Product = Relationship(back_populates="reviews")
    author: User = Relationship(back_populates="reviews")
    images: List["ReviewImage"] = Relationship(back_populates="review", cascade_delete=True)


class ProductImage(SQLModel, table=True):
    """Images associated with products"""

    __tablename__ = "product_images"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    file_size: int = Field()  # in bytes
    mime_type: str = Field(max_length=100)
    alt_text: str = Field(max_length=255, default="")
    caption: str = Field(max_length=500, default="")
    display_order: int = Field(default=0)
    is_primary: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign keys
    product_id: int = Field(foreign_key="products.id", index=True)

    # Relationships
    product: Product = Relationship(back_populates="images")


class ReviewImage(SQLModel, table=True):
    """Images associated with review articles"""

    __tablename__ = "review_images"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    file_size: int = Field()  # in bytes
    mime_type: str = Field(max_length=100)
    alt_text: str = Field(max_length=255, default="")
    caption: str = Field(max_length=500, default="")
    display_order: int = Field(default=0)
    is_featured: bool = Field(default=False)  # Featured image for the review
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign keys
    review_id: int = Field(foreign_key="reviews.id", index=True)

    # Relationships
    review: Review = Relationship(back_populates="images")


# Non-persistent schemas (for validation, forms, API requests/responses)


class UserCreate(SQLModel, table=False):
    """Schema for creating a new user"""

    username: str = Field(max_length=50)
    email: str = Field(max_length=255)
    full_name: str = Field(max_length=100)
    is_admin: bool = Field(default=False)


class UserUpdate(SQLModel, table=False):
    """Schema for updating user information"""

    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    is_admin: Optional[bool] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class CategoryCreate(SQLModel, table=False):
    """Schema for creating a new category"""

    name: str = Field(max_length=100)
    slug: str = Field(max_length=100)
    description: str = Field(max_length=500, default="")
    display_order: int = Field(default=0)


class CategoryUpdate(SQLModel, table=False):
    """Schema for updating category information"""

    name: Optional[str] = Field(default=None, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    display_order: Optional[int] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class BrandCreate(SQLModel, table=False):
    """Schema for creating a new brand"""

    name: str = Field(max_length=100)
    slug: str = Field(max_length=100)
    description: str = Field(max_length=500, default="")
    website_url: str = Field(max_length=500, default="")
    logo_url: str = Field(max_length=500, default="")


class BrandUpdate(SQLModel, table=False):
    """Schema for updating brand information"""

    name: Optional[str] = Field(default=None, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    website_url: Optional[str] = Field(default=None, max_length=500)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = Field(default=None)


class ProductCreate(SQLModel, table=False):
    """Schema for creating a new product"""

    name: str = Field(max_length=200)
    slug: str = Field(max_length=200)
    model_number: str = Field(max_length=100, default="")
    brand_id: int
    category_id: int
    msrp_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    current_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    purchase_url: str = Field(max_length=500, default="")
    affiliate_url: str = Field(max_length=500, default="")
    specs: Dict[str, Any] = Field(default={})
    features: List[str] = Field(default=[])


class ProductUpdate(SQLModel, table=False):
    """Schema for updating product information"""

    name: Optional[str] = Field(default=None, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=200)
    model_number: Optional[str] = Field(default=None, max_length=100)
    brand_id: Optional[int] = Field(default=None)
    category_id: Optional[int] = Field(default=None)
    msrp_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    current_price: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    purchase_url: Optional[str] = Field(default=None, max_length=500)
    affiliate_url: Optional[str] = Field(default=None, max_length=500)
    specs: Optional[Dict[str, Any]] = Field(default=None)
    features: Optional[List[str]] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class ReviewCreate(SQLModel, table=False):
    """Schema for creating a new review"""

    title: str = Field(max_length=200)
    slug: str = Field(max_length=200)
    summary: str = Field(max_length=500, default="")
    content: str
    rating: Decimal = Field(decimal_places=1, max_digits=2, ge=0.0, le=5.0)
    pros: List[str] = Field(default=[])
    cons: List[str] = Field(default=[])
    product_id: int
    author_id: int
    is_published: bool = Field(default=False)
    is_featured: bool = Field(default=False)


class ReviewUpdate(SQLModel, table=False):
    """Schema for updating review information"""

    title: Optional[str] = Field(default=None, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=500)
    content: Optional[str] = Field(default=None)
    rating: Optional[Decimal] = Field(default=None, decimal_places=1, max_digits=2, ge=0.0, le=5.0)
    pros: Optional[List[str]] = Field(default=None)
    cons: Optional[List[str]] = Field(default=None)
    product_id: Optional[int] = Field(default=None)
    is_published: Optional[bool] = Field(default=None)
    is_featured: Optional[bool] = Field(default=None)


class ImageUpload(SQLModel, table=False):
    """Schema for image upload information"""

    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    file_size: int
    mime_type: str = Field(max_length=100)
    alt_text: str = Field(max_length=255, default="")
    caption: str = Field(max_length=500, default="")


class ProductImageCreate(ImageUpload, table=False):
    """Schema for creating product images"""

    product_id: int
    display_order: int = Field(default=0)
    is_primary: bool = Field(default=False)


class ReviewImageCreate(ImageUpload, table=False):
    """Schema for creating review images"""

    review_id: int
    display_order: int = Field(default=0)
    is_featured: bool = Field(default=False)


class ReviewSummary(SQLModel, table=False):
    """Schema for review summaries in listings"""

    id: int
    title: str
    slug: str
    summary: str
    rating: Decimal
    published_at: Optional[str] = Field(default=None)  # ISO format string
    view_count: int
    product_name: str
    brand_name: str
    category_name: str
    featured_image_url: Optional[str] = Field(default=None)


class ProductSummary(SQLModel, table=False):
    """Schema for product summaries in listings"""

    id: int
    name: str
    slug: str
    brand_name: str
    category_name: str
    current_price: Optional[Decimal] = Field(default=None)
    average_rating: Optional[Decimal] = Field(default=None)
    review_count: int
    primary_image_url: Optional[str] = Field(default=None)
