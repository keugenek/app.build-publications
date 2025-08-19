"""Service layer for plumbing business operations"""

import logging
from sqlmodel import select, col
from typing import Optional
from decimal import Decimal

from app.database import get_session
from app.models import (
    Service,
    Testimonial,
    ContactLead,
    ServiceCreate,
    ServiceUpdate,
    TestimonialCreate,
    TestimonialUpdate,
    ContactLeadCreate,
    ContactLeadUpdate,
)

logger = logging.getLogger(__name__)


class ServiceService:
    """Service for managing plumbing services"""

    @staticmethod
    def create_service(service_data: ServiceCreate) -> Optional[Service]:
        """Create a new service"""
        try:
            with get_session() as session:
                service = Service(**service_data.model_dump())
                session.add(service)
                session.commit()
                session.refresh(service)
                return service
        except Exception as e:
            logger.error(f"Error creating service: {e}")
            return None

    @staticmethod
    def get_all_services(active_only: bool = True) -> list[Service]:
        """Get all services, optionally filtered by active status"""
        with get_session() as session:
            query = select(Service).order_by(col(Service.display_order), col(Service.title))
            if active_only:
                query = query.where(Service.is_active)
            return list(session.exec(query))

    @staticmethod
    def get_service_by_id(service_id: int) -> Optional[Service]:
        """Get service by ID"""
        with get_session() as session:
            return session.get(Service, service_id)

    @staticmethod
    def update_service(service_id: int, service_data: ServiceUpdate) -> Optional[Service]:
        """Update an existing service"""
        with get_session() as session:
            service = session.get(Service, service_id)
            if service is None:
                return None

            for field, value in service_data.model_dump(exclude_unset=True).items():
                setattr(service, field, value)

            session.add(service)
            session.commit()
            session.refresh(service)
            return service

    @staticmethod
    def delete_service(service_id: int) -> bool:
        """Delete a service"""
        with get_session() as session:
            service = session.get(Service, service_id)
            if service is None:
                return False

            session.delete(service)
            session.commit()
            return True


class TestimonialService:
    """Service for managing customer testimonials"""

    @staticmethod
    def create_testimonial(testimonial_data: TestimonialCreate) -> Optional[Testimonial]:
        """Create a new testimonial"""
        try:
            with get_session() as session:
                testimonial = Testimonial(**testimonial_data.model_dump())
                session.add(testimonial)
                session.commit()
                session.refresh(testimonial)
                return testimonial
        except Exception as e:
            logger.error(f"Error creating testimonial: {e}")
            return None

    @staticmethod
    def get_featured_testimonials() -> list[Testimonial]:
        """Get featured and approved testimonials for homepage display"""
        with get_session() as session:
            query = (
                select(Testimonial)
                .where(Testimonial.is_approved)
                .where(Testimonial.is_featured)
                .order_by(col(Testimonial.display_order), col(Testimonial.created_at).desc())
            )
            return list(session.exec(query))

    @staticmethod
    def get_all_testimonials(approved_only: bool = True) -> list[Testimonial]:
        """Get all testimonials, optionally filtered by approval status"""
        with get_session() as session:
            query = select(Testimonial).order_by(col(Testimonial.display_order), col(Testimonial.created_at).desc())
            if approved_only:
                query = query.where(Testimonial.is_approved)
            return list(session.exec(query))

    @staticmethod
    def get_testimonial_by_id(testimonial_id: int) -> Optional[Testimonial]:
        """Get testimonial by ID"""
        with get_session() as session:
            return session.get(Testimonial, testimonial_id)

    @staticmethod
    def update_testimonial(testimonial_id: int, testimonial_data: TestimonialUpdate) -> Optional[Testimonial]:
        """Update an existing testimonial"""
        with get_session() as session:
            testimonial = session.get(Testimonial, testimonial_id)
            if testimonial is None:
                return None

            for field, value in testimonial_data.model_dump(exclude_unset=True).items():
                setattr(testimonial, field, value)

            session.add(testimonial)
            session.commit()
            session.refresh(testimonial)
            return testimonial


class ContactLeadService:
    """Service for managing contact leads"""

    @staticmethod
    def create_lead(lead_data: ContactLeadCreate) -> Optional[ContactLead]:
        """Create a new contact lead from form submission"""
        try:
            with get_session() as session:
                lead = ContactLead(**lead_data.model_dump())
                session.add(lead)
                session.commit()
                session.refresh(lead)
                return lead
        except Exception as e:
            logger.error(f"Error creating contact lead: {e}")
            return None

    @staticmethod
    def get_all_leads() -> list[ContactLead]:
        """Get all contact leads ordered by creation date"""
        with get_session() as session:
            query = select(ContactLead).order_by(col(ContactLead.created_at).desc())
            return list(session.exec(query))

    @staticmethod
    def get_lead_by_id(lead_id: int) -> Optional[ContactLead]:
        """Get contact lead by ID"""
        with get_session() as session:
            return session.get(ContactLead, lead_id)

    @staticmethod
    def update_lead(lead_id: int, lead_data: ContactLeadUpdate) -> Optional[ContactLead]:
        """Update contact lead (for internal tracking)"""
        with get_session() as session:
            lead = session.get(ContactLead, lead_id)
            if lead is None:
                return None

            for field, value in lead_data.model_dump(exclude_unset=True).items():
                setattr(lead, field, value)

            session.add(lead)
            session.commit()
            session.refresh(lead)
            return lead

    @staticmethod
    def get_leads_by_status(status: str) -> list[ContactLead]:
        """Get leads by status"""
        with get_session() as session:
            query = (
                select(ContactLead)
                .where(ContactLead.lead_status == status)
                .order_by(col(ContactLead.created_at).desc())
            )
            return list(session.exec(query))


def initialize_sample_data() -> None:
    """Initialize the database with sample services and testimonials"""
    # Sample services
    services_data = [
        ServiceCreate(
            title="Emergency Leak Repair",
            description="24/7 emergency leak detection and repair service. Fast response time to prevent water damage.",
            price_range_min=Decimal("75"),
            price_range_max=Decimal("300"),
            display_order=1,
        ),
        ServiceCreate(
            title="Water Heater Installation & Repair",
            description="Professional water heater installation, maintenance, and repair for all brands and types.",
            price_range_min=Decimal("150"),
            price_range_max=Decimal("1500"),
            display_order=2,
        ),
        ServiceCreate(
            title="Drain Cleaning & Unclogging",
            description="Complete drain cleaning services using professional equipment to clear any blockage.",
            price_range_min=Decimal("100"),
            price_range_max=Decimal("250"),
            display_order=3,
        ),
        ServiceCreate(
            title="Pipe Installation & Repair",
            description="Expert pipe installation and repair services for residential and commercial properties.",
            price_range_min=Decimal("120"),
            price_range_max=Decimal("800"),
            display_order=4,
        ),
        ServiceCreate(
            title="Bathroom & Kitchen Plumbing",
            description="Complete plumbing solutions for bathroom and kitchen renovations and installations.",
            price_range_min=Decimal("200"),
            price_range_max=Decimal("2000"),
            display_order=5,
        ),
        ServiceCreate(
            title="Sewer Line Services",
            description="Comprehensive sewer line inspection, cleaning, repair, and replacement services.",
            price_range_min=Decimal("300"),
            price_range_max=Decimal("3000"),
            display_order=6,
        ),
    ]

    # Sample testimonials
    testimonials_data = [
        TestimonialCreate(
            customer_name="Sarah Johnson",
            customer_location="Downtown District",
            rating=5,
            testimonial_text="Excellent service! They fixed our emergency leak at 2 AM and saved us from major water damage. Professional and reliable.",
            service_type="Emergency Leak Repair",
            is_featured=True,
            display_order=1,
        ),
        TestimonialCreate(
            customer_name="Mike Thompson",
            customer_location="Riverside Area",
            rating=5,
            testimonial_text="Outstanding water heater installation. Clean work, fair pricing, and they explained everything clearly. Highly recommended!",
            service_type="Water Heater Installation",
            is_featured=True,
            display_order=2,
        ),
        TestimonialCreate(
            customer_name="Lisa Rodriguez",
            customer_location="Oak Valley",
            rating=5,
            testimonial_text="Fast and effective drain cleaning service. They cleared our stubborn kitchen drain in no time. Great customer service!",
            service_type="Drain Cleaning",
            is_featured=True,
            display_order=3,
        ),
        TestimonialCreate(
            customer_name="David Chen",
            customer_location="Sunset Heights",
            rating=4,
            testimonial_text="Professional pipe repair service. They diagnosed the problem quickly and fixed it efficiently. Very satisfied with the results.",
            service_type="Pipe Repair",
            is_featured=True,
            display_order=4,
        ),
    ]

    # Create services
    for service_data in services_data:
        ServiceService.create_service(service_data)

    # Create testimonials and approve them
    for testimonial_data in testimonials_data:
        testimonial = TestimonialService.create_testimonial(testimonial_data)
        if testimonial and testimonial.id is not None:
            TestimonialService.update_testimonial(testimonial.id, TestimonialUpdate(is_approved=True))
