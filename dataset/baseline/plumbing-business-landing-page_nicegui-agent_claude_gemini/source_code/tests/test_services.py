"""Tests for plumbing business services"""

import pytest
from decimal import Decimal
from app.database import reset_db
from app.services import ServiceService, TestimonialService, ContactLeadService
from app.models import (
    ServiceCreate,
    ServiceUpdate,
    TestimonialCreate,
    TestimonialUpdate,
    ContactLeadCreate,
    ContactLeadUpdate,
)


@pytest.fixture()
def fresh_db():
    """Fresh database for each test"""
    reset_db()
    yield
    reset_db()


class TestServiceService:
    """Test ServiceService functionality"""

    def test_create_service(self, fresh_db):
        """Test creating a new service"""
        service_data = ServiceCreate(
            title="Test Service",
            description="Test description",
            price_range_min=Decimal("100"),
            price_range_max=Decimal("200"),
            display_order=1,
        )

        service = ServiceService.create_service(service_data)

        assert service is not None
        assert service.title == "Test Service"
        assert service.description == "Test description"
        assert service.price_range_min == Decimal("100")
        assert service.price_range_max == Decimal("200")
        assert service.is_active
        assert service.display_order == 1
        assert service.id is not None

    def test_create_service_minimal_data(self, fresh_db):
        """Test creating service with minimal required data"""
        service_data = ServiceCreate(title="Minimal Service", description="Basic description")

        service = ServiceService.create_service(service_data)

        assert service is not None
        assert service.title == "Minimal Service"
        assert service.price_range_min is None
        assert service.price_range_max is None
        assert service.display_order == 0

    def test_get_all_services_empty(self, fresh_db):
        """Test getting services when none exist"""
        services = ServiceService.get_all_services()
        assert services == []

    def test_get_all_services_active_only(self, fresh_db):
        """Test filtering active services"""
        # Create active and inactive services
        ServiceService.create_service(ServiceCreate(title="Active Service", description="Active description"))

        inactive_service = ServiceService.create_service(
            ServiceCreate(title="Inactive Service", description="Inactive description")
        )

        # Make one inactive
        if inactive_service and inactive_service.id is not None:
            ServiceService.update_service(inactive_service.id, ServiceUpdate(is_active=False))

        # Get active only
        active_services = ServiceService.get_all_services(active_only=True)
        assert len(active_services) == 1
        assert active_services[0].title == "Active Service"

        # Get all services
        all_services = ServiceService.get_all_services(active_only=False)
        assert len(all_services) == 2

    def test_get_service_by_id(self, fresh_db):
        """Test getting service by ID"""
        service = ServiceService.create_service(ServiceCreate(title="Test Service", description="Test description"))

        if service and service.id is not None:
            retrieved_service = ServiceService.get_service_by_id(service.id)
            assert retrieved_service is not None
            assert retrieved_service.title == "Test Service"

        # Test non-existent service
        non_existent = ServiceService.get_service_by_id(999)
        assert non_existent is None

    def test_update_service(self, fresh_db):
        """Test updating service"""
        service = ServiceService.create_service(
            ServiceCreate(title="Original Service", description="Original description")
        )

        if service and service.id is not None:
            updated_service = ServiceService.update_service(
                service.id, ServiceUpdate(title="Updated Service", price_range_min=Decimal("150"))
            )

            assert updated_service is not None
            assert updated_service.title == "Updated Service"
            assert updated_service.description == "Original description"  # Unchanged
            assert updated_service.price_range_min == Decimal("150")

    def test_update_nonexistent_service(self, fresh_db):
        """Test updating non-existent service"""
        result = ServiceService.update_service(999, ServiceUpdate(title="Updated"))
        assert result is None

    def test_delete_service(self, fresh_db):
        """Test deleting service"""
        service = ServiceService.create_service(ServiceCreate(title="To Delete", description="Will be deleted"))

        if service and service.id is not None:
            # Delete the service
            success = ServiceService.delete_service(service.id)
            assert success

            # Verify it's gone
            retrieved = ServiceService.get_service_by_id(service.id)
            assert retrieved is None

        # Test deleting non-existent service
        success = ServiceService.delete_service(999)
        assert not success


class TestTestimonialService:
    """Test TestimonialService functionality"""

    def test_create_testimonial(self, fresh_db):
        """Test creating a new testimonial"""
        testimonial_data = TestimonialCreate(
            customer_name="John Doe",
            customer_location="Test City",
            rating=5,
            testimonial_text="Great service!",
            service_type="Pipe Repair",
            is_featured=True,
            display_order=1,
        )

        testimonial = TestimonialService.create_testimonial(testimonial_data)

        assert testimonial is not None
        assert testimonial.customer_name == "John Doe"
        assert testimonial.rating == 5
        assert testimonial.testimonial_text == "Great service!"
        assert testimonial.is_featured
        assert not testimonial.is_approved  # Default is False
        assert testimonial.id is not None

    def test_create_testimonial_minimal(self, fresh_db):
        """Test creating testimonial with minimal data"""
        testimonial_data = TestimonialCreate(
            customer_name="Jane Doe", customer_location="Another City", rating=4, testimonial_text="Good work!"
        )

        testimonial = TestimonialService.create_testimonial(testimonial_data)

        assert testimonial is not None
        assert not testimonial.is_featured  # Default
        assert testimonial.service_type is None

    def test_get_featured_testimonials_empty(self, fresh_db):
        """Test getting featured testimonials when none exist"""
        testimonials = TestimonialService.get_featured_testimonials()
        assert testimonials == []

    def test_get_featured_testimonials(self, fresh_db):
        """Test getting featured and approved testimonials"""
        # Create testimonials with different statuses
        featured_approved = TestimonialService.create_testimonial(
            TestimonialCreate(
                customer_name="Featured User",
                customer_location="City",
                rating=5,
                testimonial_text="Featured and approved",
                is_featured=True,
            )
        )

        not_featured = TestimonialService.create_testimonial(
            TestimonialCreate(
                customer_name="Regular User",
                customer_location="City",
                rating=4,
                testimonial_text="Not featured",
                is_featured=False,
            )
        )

        TestimonialService.create_testimonial(
            TestimonialCreate(
                customer_name="Featured Not Approved",
                customer_location="City",
                rating=5,
                testimonial_text="Featured but not approved",
                is_featured=True,
            )
        )

        # Approve the featured one
        if featured_approved and featured_approved.id is not None:
            TestimonialService.update_testimonial(featured_approved.id, TestimonialUpdate(is_approved=True))

        # Approve the not-featured one
        if not_featured and not_featured.id is not None:
            TestimonialService.update_testimonial(not_featured.id, TestimonialUpdate(is_approved=True))

        # Get featured testimonials (should only return approved + featured)
        featured = TestimonialService.get_featured_testimonials()
        assert len(featured) == 1
        assert featured[0].customer_name == "Featured User"
        assert featured[0].is_featured
        assert featured[0].is_approved

    def test_update_testimonial(self, fresh_db):
        """Test updating testimonial"""
        testimonial = TestimonialService.create_testimonial(
            TestimonialCreate(
                customer_name="Original Name",
                customer_location="Original City",
                rating=3,
                testimonial_text="Original text",
            )
        )

        if testimonial and testimonial.id is not None:
            updated = TestimonialService.update_testimonial(
                testimonial.id, TestimonialUpdate(customer_name="Updated Name", rating=5, is_approved=True)
            )

            assert updated is not None
            assert updated.customer_name == "Updated Name"
            assert updated.customer_location == "Original City"  # Unchanged
            assert updated.rating == 5
            assert updated.is_approved


class TestContactLeadService:
    """Test ContactLeadService functionality"""

    def test_create_lead(self, fresh_db):
        """Test creating a new contact lead"""
        lead_data = ContactLeadCreate(
            name="John Customer",
            email="john@example.com",
            phone_number="555-123-4567",
            message="Need plumbing help",
            preferred_contact_method="phone",
            service_interest="Leak Repair",
        )

        lead = ContactLeadService.create_lead(lead_data)

        assert lead is not None
        assert lead.name == "John Customer"
        assert lead.email == "john@example.com"
        assert lead.phone_number == "555-123-4567"
        assert lead.message == "Need plumbing help"
        assert lead.preferred_contact_method == "phone"
        assert lead.service_interest == "Leak Repair"
        assert not lead.is_contacted  # Default
        assert lead.lead_status == "new"  # Default
        assert lead.id is not None

    def test_create_lead_minimal(self, fresh_db):
        """Test creating lead with minimal required data"""
        lead_data = ContactLeadCreate(
            name="Jane Customer", email="jane@example.com", phone_number="555-987-6543", message="Help needed"
        )

        lead = ContactLeadService.create_lead(lead_data)

        assert lead is not None
        assert lead.preferred_contact_method is None
        assert lead.service_interest is None

    def test_get_all_leads_empty(self, fresh_db):
        """Test getting leads when none exist"""
        leads = ContactLeadService.get_all_leads()
        assert leads == []

    def test_get_all_leads_order(self, fresh_db):
        """Test leads are returned in creation order (newest first)"""
        # Create multiple leads
        ContactLeadService.create_lead(
            ContactLeadCreate(
                name="First Customer", email="first@example.com", phone_number="555-111-1111", message="First message"
            )
        )

        ContactLeadService.create_lead(
            ContactLeadCreate(
                name="Second Customer",
                email="second@example.com",
                phone_number="555-222-2222",
                message="Second message",
            )
        )

        leads = ContactLeadService.get_all_leads()
        assert len(leads) == 2
        # Should be ordered newest first
        assert leads[0].name == "Second Customer"
        assert leads[1].name == "First Customer"

    def test_get_lead_by_id(self, fresh_db):
        """Test getting lead by ID"""
        lead = ContactLeadService.create_lead(
            ContactLeadCreate(
                name="Test Customer", email="test@example.com", phone_number="555-555-5555", message="Test message"
            )
        )

        if lead and lead.id is not None:
            retrieved = ContactLeadService.get_lead_by_id(lead.id)
            assert retrieved is not None
            assert retrieved.name == "Test Customer"

        # Test non-existent lead
        non_existent = ContactLeadService.get_lead_by_id(999)
        assert non_existent is None

    def test_update_lead(self, fresh_db):
        """Test updating lead status"""
        lead = ContactLeadService.create_lead(
            ContactLeadCreate(
                name="Customer", email="customer@example.com", phone_number="555-000-0000", message="Need help"
            )
        )

        if lead and lead.id is not None:
            updated = ContactLeadService.update_lead(
                lead.id,
                ContactLeadUpdate(is_contacted=True, lead_status="contacted", contact_notes="Called customer back"),
            )

            assert updated is not None
            assert updated.is_contacted
            assert updated.lead_status == "contacted"
            assert updated.contact_notes == "Called customer back"
            assert updated.name == "Customer"  # Unchanged

    def test_get_leads_by_status(self, fresh_db):
        """Test filtering leads by status"""
        # Create leads with different statuses
        ContactLeadService.create_lead(
            ContactLeadCreate(
                name="New Lead", email="new@example.com", phone_number="555-111-1111", message="New message"
            )
        )

        lead2 = ContactLeadService.create_lead(
            ContactLeadCreate(
                name="Contacted Lead",
                email="contacted@example.com",
                phone_number="555-222-2222",
                message="Contacted message",
            )
        )

        # Update second lead status
        if lead2 and lead2.id is not None:
            ContactLeadService.update_lead(lead2.id, ContactLeadUpdate(lead_status="contacted"))

        # Test filtering
        new_leads = ContactLeadService.get_leads_by_status("new")
        contacted_leads = ContactLeadService.get_leads_by_status("contacted")

        assert len(new_leads) == 1
        assert new_leads[0].name == "New Lead"

        assert len(contacted_leads) == 1
        assert contacted_leads[0].name == "Contacted Lead"

        # Test non-existent status
        empty_leads = ContactLeadService.get_leads_by_status("nonexistent")
        assert empty_leads == []


class TestDataValidation:
    """Test data validation and edge cases"""

    def test_service_price_range_validation(self, fresh_db):
        """Test service price range handling"""
        service = ServiceService.create_service(
            ServiceCreate(
                title="Price Test Service",
                description="Testing price ranges",
                price_range_min=Decimal("0"),
                price_range_max=Decimal("999999.99"),
            )
        )

        assert service is not None
        assert service.price_range_min == Decimal("0")
        assert service.price_range_max == Decimal("999999.99")

    def test_testimonial_rating_bounds(self, fresh_db):
        """Test testimonial rating validation"""
        # Valid ratings
        for rating in [1, 2, 3, 4, 5]:
            testimonial = TestimonialService.create_testimonial(
                TestimonialCreate(
                    customer_name=f"Customer {rating}",
                    customer_location="Test City",
                    rating=rating,
                    testimonial_text="Test testimonial",
                )
            )
            assert testimonial is not None
            assert testimonial.rating == rating

    def test_long_text_fields(self, fresh_db):
        """Test handling of long text content"""
        long_description = "A" * 1000  # Max length for service description
        long_testimonial = "B" * 1000  # Max length for testimonial text
        long_message = "C" * 2000  # Max length for contact message

        service = ServiceService.create_service(
            ServiceCreate(title="Long Description Service", description=long_description)
        )
        assert service is not None
        assert len(service.description) == 1000

        testimonial = TestimonialService.create_testimonial(
            TestimonialCreate(
                customer_name="Long Testimonial Customer",
                customer_location="Test City",
                rating=5,
                testimonial_text=long_testimonial,
            )
        )
        assert testimonial is not None
        assert len(testimonial.testimonial_text) == 1000

        lead = ContactLeadService.create_lead(
            ContactLeadCreate(
                name="Long Message Customer",
                email="long@example.com",
                phone_number="555-123-4567",
                message=long_message,
            )
        )
        assert lead is not None
        assert len(lead.message) == 2000
