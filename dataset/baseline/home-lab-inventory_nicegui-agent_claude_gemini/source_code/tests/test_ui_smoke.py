from nicegui.testing import User
from app.database import reset_db
from app.services import HardwareAssetService, SoftwareAssetService, IPAllocationService
from app.models import (
    HardwareAssetCreate,
    SoftwareAssetCreate,
    IPAllocationCreate,
    HardwareType,
    SoftwareType,
    AssetStatus,
)
import pytest


@pytest.fixture()
def fresh_db():
    """Reset database for each test"""
    reset_db()
    yield
    reset_db()


async def test_home_page_renders(user: User) -> None:
    """Test that home page loads and displays navigation cards"""
    await user.open("/")
    await user.should_see("Home Lab Infrastructure Manager")
    await user.should_see("Dashboard")
    await user.should_see("Hardware")
    await user.should_see("Software")
    await user.should_see("IP Management")


async def test_dashboard_page_renders(user: User, fresh_db) -> None:
    """Test that dashboard page loads with empty state"""
    await user.open("/dashboard")
    await user.should_see("Home Lab Infrastructure")
    await user.should_see("Hardware Assets")
    await user.should_see("Software Assets")
    await user.should_see("IP Allocations")


async def test_dashboard_with_data(user: User, fresh_db) -> None:
    """Test dashboard with sample data"""
    # Create sample data
    hardware_data = HardwareAssetCreate(name="Test Server", type=HardwareType.SERVER, status=AssetStatus.ACTIVE)
    server = HardwareAssetService.create(hardware_data)

    software_data = SoftwareAssetCreate(name="Test VM", type=SoftwareType.VM, hardware_host_id=server.id)
    SoftwareAssetService.create(software_data)

    ip_data = IPAllocationCreate(ip_address="192.168.1.10", hardware_asset_id=server.id)
    IPAllocationService.create(ip_data)

    await user.open("/dashboard")
    await user.should_see("1")  # Should show counts
    await user.should_see("Hardware by Type")
    await user.should_see("Software by Type")


async def test_hardware_assets_page_renders(user: User, fresh_db) -> None:
    """Test that hardware assets page loads"""
    await user.open("/hardware")
    await user.should_see("Hardware Assets")
    await user.should_see("Add Asset")


async def test_software_assets_page_renders(user: User, fresh_db) -> None:
    """Test that software assets page loads"""
    await user.open("/software")
    await user.should_see("Software Assets")
    await user.should_see("Add Asset")


async def test_ip_allocations_page_renders(user: User, fresh_db) -> None:
    """Test that IP allocations page loads"""
    await user.open("/ip-allocations")
    await user.should_see("IP Allocations")
    await user.should_see("Add IP")
