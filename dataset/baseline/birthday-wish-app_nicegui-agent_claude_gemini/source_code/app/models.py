from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime
from typing import Optional, List, Dict, Any


# Persistent models (stored in database)
class BirthdayCard(SQLModel, table=True):
    """Main birthday card model containing personalized message and settings."""

    __tablename__ = "birthday_cards"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, description="Card title")
    recipient_name: str = Field(max_length=100, description="Name of the birthday person")
    sender_name: str = Field(max_length=100, description="Name of the card sender")
    birthday_message: str = Field(max_length=1000, description="Personalized birthday message")
    theme_color: str = Field(default="#FF6B6B", max_length=7, description="Primary theme color in hex format")
    animation_type: str = Field(default="confetti", max_length=50, description="Type of celebratory animation")
    background_style: str = Field(default="gradient", max_length=50, description="Background style preference")
    is_active: bool = Field(default=True, description="Whether the card is currently active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    photos: List["Photo"] = Relationship(back_populates="birthday_card")
    settings: List["CardSetting"] = Relationship(back_populates="birthday_card")


class Photo(SQLModel, table=True):
    """Photo model for the birthday card gallery."""

    __tablename__ = "photos"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field(max_length=255, description="Original filename of the photo")
    file_path: str = Field(max_length=500, description="Storage path of the photo")
    caption: str = Field(default="", max_length=200, description="Optional caption for the photo")
    alt_text: str = Field(max_length=200, description="Alternative text for accessibility")
    display_order: int = Field(default=0, description="Order in which photo should be displayed")
    file_size_bytes: int = Field(description="File size in bytes")
    mime_type: str = Field(max_length=50, description="MIME type of the image")
    width_pixels: int = Field(description="Image width in pixels")
    height_pixels: int = Field(description="Image height in pixels")
    is_featured: bool = Field(default=False, description="Whether this photo is featured prominently")
    birthday_card_id: int = Field(foreign_key="birthday_cards.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    birthday_card: BirthdayCard = Relationship(back_populates="photos")


class CardSetting(SQLModel, table=True):
    """Additional settings and customizations for birthday cards."""

    __tablename__ = "card_settings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    setting_key: str = Field(max_length=100, description="Setting identifier")
    setting_value: str = Field(max_length=500, description="Setting value")
    setting_type: str = Field(max_length=50, description="Type of setting (color, text, number, boolean)")
    birthday_card_id: int = Field(foreign_key="birthday_cards.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    birthday_card: BirthdayCard = Relationship(back_populates="settings")


class Animation(SQLModel, table=True):
    """Available animation types and their configurations."""

    __tablename__ = "animations"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True, description="Animation name")
    display_name: str = Field(max_length=100, description="Human-readable animation name")
    description: str = Field(max_length=300, description="Description of the animation")
    css_class: str = Field(max_length=100, description="CSS class for the animation")
    config_json: Dict[str, Any] = Field(default={}, sa_column=Column(JSON), description="Animation configuration")
    is_active: bool = Field(default=True, description="Whether animation is available for use")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Theme(SQLModel, table=True):
    """Predefined themes for birthday cards."""

    __tablename__ = "themes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True, description="Theme identifier")
    display_name: str = Field(max_length=100, description="Human-readable theme name")
    primary_color: str = Field(max_length=7, description="Primary theme color in hex format")
    secondary_color: str = Field(max_length=7, description="Secondary theme color in hex format")
    accent_color: str = Field(max_length=7, description="Accent theme color in hex format")
    background_config: Dict[str, Any] = Field(
        default={}, sa_column=Column(JSON), description="Background configuration"
    )
    font_family: str = Field(default="Arial, sans-serif", max_length=100, description="Primary font family")
    is_active: bool = Field(default=True, description="Whether theme is available for use")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas (for validation, forms, API requests/responses)
class BirthdayCardCreate(SQLModel, table=False):
    """Schema for creating a new birthday card."""

    title: str = Field(max_length=200)
    recipient_name: str = Field(max_length=100)
    sender_name: str = Field(max_length=100)
    birthday_message: str = Field(max_length=1000)
    theme_color: str = Field(default="#FF6B6B", max_length=7)
    animation_type: str = Field(default="confetti", max_length=50)
    background_style: str = Field(default="gradient", max_length=50)


class BirthdayCardUpdate(SQLModel, table=False):
    """Schema for updating an existing birthday card."""

    title: Optional[str] = Field(default=None, max_length=200)
    recipient_name: Optional[str] = Field(default=None, max_length=100)
    sender_name: Optional[str] = Field(default=None, max_length=100)
    birthday_message: Optional[str] = Field(default=None, max_length=1000)
    theme_color: Optional[str] = Field(default=None, max_length=7)
    animation_type: Optional[str] = Field(default=None, max_length=50)
    background_style: Optional[str] = Field(default=None, max_length=50)
    is_active: Optional[bool] = Field(default=None)


class PhotoCreate(SQLModel, table=False):
    """Schema for uploading a new photo."""

    filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    caption: str = Field(default="", max_length=200)
    alt_text: str = Field(max_length=200)
    display_order: int = Field(default=0)
    file_size_bytes: int
    mime_type: str = Field(max_length=50)
    width_pixels: int
    height_pixels: int
    is_featured: bool = Field(default=False)
    birthday_card_id: int


class PhotoUpdate(SQLModel, table=False):
    """Schema for updating photo information."""

    caption: Optional[str] = Field(default=None, max_length=200)
    alt_text: Optional[str] = Field(default=None, max_length=200)
    display_order: Optional[int] = Field(default=None)
    is_featured: Optional[bool] = Field(default=None)


class CardSettingCreate(SQLModel, table=False):
    """Schema for creating card settings."""

    setting_key: str = Field(max_length=100)
    setting_value: str = Field(max_length=500)
    setting_type: str = Field(max_length=50)
    birthday_card_id: int


class AnimationCreate(SQLModel, table=False):
    """Schema for creating animations."""

    name: str = Field(max_length=50)
    display_name: str = Field(max_length=100)
    description: str = Field(max_length=300)
    css_class: str = Field(max_length=100)
    config_json: Dict[str, Any] = Field(default={})


class ThemeCreate(SQLModel, table=False):
    """Schema for creating themes."""

    name: str = Field(max_length=50)
    display_name: str = Field(max_length=100)
    primary_color: str = Field(max_length=7)
    secondary_color: str = Field(max_length=7)
    accent_color: str = Field(max_length=7)
    background_config: Dict[str, Any] = Field(default={})
    font_family: str = Field(default="Arial, sans-serif", max_length=100)


class BirthdayCardResponse(SQLModel, table=False):
    """Schema for birthday card responses with related data."""

    id: int
    title: str
    recipient_name: str
    sender_name: str
    birthday_message: str
    theme_color: str
    animation_type: str
    background_style: str
    is_active: bool
    created_at: str  # ISO format datetime string
    updated_at: str  # ISO format datetime string
    photos: List["PhotoResponse"]
    settings: List["CardSettingResponse"]


class PhotoResponse(SQLModel, table=False):
    """Schema for photo responses."""

    id: int
    filename: str
    file_path: str
    caption: str
    alt_text: str
    display_order: int
    file_size_bytes: int
    mime_type: str
    width_pixels: int
    height_pixels: int
    is_featured: bool
    uploaded_at: str  # ISO format datetime string


class CardSettingResponse(SQLModel, table=False):
    """Schema for card setting responses."""

    id: int
    setting_key: str
    setting_value: str
    setting_type: str
    created_at: str  # ISO format datetime string
