from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal


# Persistent models (stored in database)


class Service(SQLModel, table=True):
    """Plumbing services offered by the business"""

    __tablename__ = "services"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=100, description="Service name")
    description: str = Field(max_length=1000, description="Detailed service description")
    price_range_min: Optional[Decimal] = Field(default=None, description="Minimum price for service")
    price_range_max: Optional[Decimal] = Field(default=None, description="Maximum price for service")
    is_active: bool = Field(default=True, description="Whether service is currently offered")
    display_order: int = Field(default=0, description="Order for displaying services")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Testimonial(SQLModel, table=True):
    """Customer testimonials for the plumbing business"""

    __tablename__ = "testimonials"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    customer_name: str = Field(max_length=100, description="Customer's name")
    customer_location: str = Field(max_length=100, description="Customer's city or area")
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5 stars")
    testimonial_text: str = Field(max_length=1000, description="Customer testimonial content")
    service_type: Optional[str] = Field(default=None, max_length=100, description="Type of service received")
    is_featured: bool = Field(default=False, description="Whether to feature prominently on homepage")
    is_approved: bool = Field(default=False, description="Whether testimonial is approved for display")
    display_order: int = Field(default=0, description="Order for displaying testimonials")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ContactLead(SQLModel, table=True):
    """Lead information from contact form submissions"""

    __tablename__ = "contact_leads"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, description="Customer's full name")
    email: str = Field(max_length=255, description="Customer's email address")
    phone_number: str = Field(max_length=20, description="Customer's phone number")
    message: str = Field(max_length=2000, description="Customer's message or service request")
    preferred_contact_method: Optional[str] = Field(default=None, max_length=20, description="Email, phone, or text")
    service_interest: Optional[str] = Field(default=None, max_length=100, description="Interested service type")
    is_contacted: bool = Field(default=False, description="Whether customer has been contacted")
    contact_notes: Optional[str] = Field(default=None, max_length=1000, description="Internal notes about contact")
    lead_status: str = Field(
        default="new", max_length=20, description="Status: new, contacted, qualified, converted, closed"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    contacted_at: Optional[datetime] = Field(default=None, description="When customer was first contacted")


# Non-persistent schemas (for validation, forms, API requests/responses)


class ServiceCreate(SQLModel, table=False):
    """Schema for creating new services"""

    title: str = Field(max_length=100)
    description: str = Field(max_length=1000)
    price_range_min: Optional[Decimal] = Field(default=None)
    price_range_max: Optional[Decimal] = Field(default=None)
    display_order: int = Field(default=0)


class ServiceUpdate(SQLModel, table=False):
    """Schema for updating existing services"""

    title: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    price_range_min: Optional[Decimal] = Field(default=None)
    price_range_max: Optional[Decimal] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)
    display_order: Optional[int] = Field(default=None)


class TestimonialCreate(SQLModel, table=False):
    """Schema for creating new testimonials"""

    customer_name: str = Field(max_length=100)
    customer_location: str = Field(max_length=100)
    rating: int = Field(ge=1, le=5)
    testimonial_text: str = Field(max_length=1000)
    service_type: Optional[str] = Field(default=None, max_length=100)
    is_featured: bool = Field(default=False)
    display_order: int = Field(default=0)


class TestimonialUpdate(SQLModel, table=False):
    """Schema for updating existing testimonials"""

    customer_name: Optional[str] = Field(default=None, max_length=100)
    customer_location: Optional[str] = Field(default=None, max_length=100)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    testimonial_text: Optional[str] = Field(default=None, max_length=1000)
    service_type: Optional[str] = Field(default=None, max_length=100)
    is_featured: Optional[bool] = Field(default=None)
    is_approved: Optional[bool] = Field(default=None)
    display_order: Optional[int] = Field(default=None)


class ContactLeadCreate(SQLModel, table=False):
    """Schema for creating contact leads from form submissions"""

    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    phone_number: str = Field(max_length=20)
    message: str = Field(max_length=2000)
    preferred_contact_method: Optional[str] = Field(default=None, max_length=20)
    service_interest: Optional[str] = Field(default=None, max_length=100)


class ContactLeadUpdate(SQLModel, table=False):
    """Schema for updating contact leads (internal use)"""

    is_contacted: Optional[bool] = Field(default=None)
    contact_notes: Optional[str] = Field(default=None, max_length=1000)
    lead_status: Optional[str] = Field(default=None, max_length=20)
    contacted_at: Optional[datetime] = Field(default=None)


class ContactLeadResponse(SQLModel, table=False):
    """Schema for contact lead API responses"""

    id: int
    name: str
    email: str
    phone_number: str
    message: str
    preferred_contact_method: Optional[str]
    service_interest: Optional[str]
    is_contacted: bool
    lead_status: str
    created_at: str  # ISO format string


class ServiceResponse(SQLModel, table=False):
    """Schema for service API responses"""

    id: int
    title: str
    description: str
    price_range_min: Optional[Decimal]
    price_range_max: Optional[Decimal]
    is_active: bool
    display_order: int
    created_at: str  # ISO format string


class TestimonialResponse(SQLModel, table=False):
    """Schema for testimonial API responses"""

    id: int
    customer_name: str
    customer_location: str
    rating: int
    testimonial_text: str
    service_type: Optional[str]
    is_featured: bool
    is_approved: bool
    display_order: int
    created_at: str  # ISO format string
