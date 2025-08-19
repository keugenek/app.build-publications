import pytest
from app.database import reset_db
from app.services import HardwareAssetService, SoftwareAssetService, IPAllocationService, DashboardService
from app.models import (
    HardwareAssetCreate,
    HardwareAssetUpdate,
    SoftwareAssetCreate,
    SoftwareAssetUpdate,
    IPAllocationCreate,
    IPAllocationUpdate,
    HardwareType,
    SoftwareType,
    AssetStatus,
)


@pytest.fixture()
def fresh_db():
    """Reset database for each test"""
    reset_db()
    yield
    reset_db()


class TestHardwareAssetService:
    """Test hardware asset service functionality"""

    def test_create_hardware_asset(self, fresh_db):
        """Test creating a new hardware asset"""
        asset_data = HardwareAssetCreate(
            name="Test Server",
            type=HardwareType.SERVER,
            status=AssetStatus.ACTIVE,
            manufacturer="Dell",
            model="PowerEdge R750",
            serial_number="ABC123",
            location="Rack 1 U10",
            notes="Test server for development",
        )

        result = HardwareAssetService.create(asset_data)

        assert result.id is not None
        assert result.name == "Test Server"
        assert result.type == HardwareType.SERVER
        assert result.status == AssetStatus.ACTIVE
        assert result.manufacturer == "Dell"
        assert result.model == "PowerEdge R750"
        assert result.serial_number == "ABC123"
        assert result.location == "Rack 1 U10"
        assert result.notes == "Test server for development"
        assert result.created_at is not None
        assert result.updated_at is not None

    def test_get_all_hardware_assets(self, fresh_db):
        """Test retrieving all hardware assets"""
        # Create test assets
        asset1_data = HardwareAssetCreate(name="Server 1", type=HardwareType.SERVER)
        asset2_data = HardwareAssetCreate(name="Switch 1", type=HardwareType.SWITCH)

        HardwareAssetService.create(asset1_data)
        HardwareAssetService.create(asset2_data)

        assets = HardwareAssetService.get_all()

        assert len(assets) == 2
        assert any(asset.name == "Server 1" for asset in assets)
        assert any(asset.name == "Switch 1" for asset in assets)

    def test_get_hardware_asset_by_id(self, fresh_db):
        """Test retrieving hardware asset by ID"""
        asset_data = HardwareAssetCreate(name="Test Asset", type=HardwareType.SERVER)
        created = HardwareAssetService.create(asset_data)

        if created.id is not None:
            retrieved = HardwareAssetService.get_by_id(created.id)

            assert retrieved is not None
            assert retrieved.id == created.id
            assert retrieved.name == "Test Asset"

    def test_get_hardware_asset_by_nonexistent_id(self, fresh_db):
        """Test retrieving non-existent hardware asset returns None"""
        result = HardwareAssetService.get_by_id(999)
        assert result is None

    def test_update_hardware_asset(self, fresh_db):
        """Test updating hardware asset"""
        asset_data = HardwareAssetCreate(name="Original Name", type=HardwareType.SERVER)
        created = HardwareAssetService.create(asset_data)

        update_data = HardwareAssetUpdate(name="Updated Name", status=AssetStatus.MAINTENANCE, manufacturer="HP")

        updated = HardwareAssetService.update(created.id, update_data) if created.id is not None else None

        assert updated is not None
        assert updated.name == "Updated Name"
        assert updated.status == AssetStatus.MAINTENANCE
        assert updated.manufacturer == "HP"
        assert updated.type == HardwareType.SERVER  # Unchanged
        assert updated.updated_at > updated.created_at

    def test_update_nonexistent_hardware_asset(self, fresh_db):
        """Test updating non-existent asset returns None"""
        update_data = HardwareAssetUpdate(name="Test")
        result = HardwareAssetService.update(999, update_data)
        assert result is None

    def test_delete_hardware_asset(self, fresh_db):
        """Test deleting hardware asset"""
        asset_data = HardwareAssetCreate(name="To Delete", type=HardwareType.SERVER)
        created = HardwareAssetService.create(asset_data)

        success = HardwareAssetService.delete(created.id) if created.id is not None else False
        assert success

        # Verify deletion
        retrieved = HardwareAssetService.get_by_id(created.id) if created.id is not None else None
        assert retrieved is None

    def test_delete_nonexistent_hardware_asset(self, fresh_db):
        """Test deleting non-existent asset returns False"""
        result = HardwareAssetService.delete(999)
        assert not result

    def test_get_hardware_assets_by_status(self, fresh_db):
        """Test filtering hardware assets by status"""
        active_asset = HardwareAssetCreate(name="Active", status=AssetStatus.ACTIVE)
        inactive_asset = HardwareAssetCreate(name="Inactive", status=AssetStatus.INACTIVE)

        HardwareAssetService.create(active_asset)
        HardwareAssetService.create(inactive_asset)

        active_assets = HardwareAssetService.get_by_status(AssetStatus.ACTIVE)
        inactive_assets = HardwareAssetService.get_by_status(AssetStatus.INACTIVE)

        assert len(active_assets) == 1
        assert len(inactive_assets) == 1
        assert active_assets[0].name == "Active"
        assert inactive_assets[0].name == "Inactive"


class TestSoftwareAssetService:
    """Test software asset service functionality"""

    def test_create_software_asset(self, fresh_db):
        """Test creating a new software asset"""
        asset_data = SoftwareAssetCreate(
            name="Test VM",
            type=SoftwareType.VM,
            status=AssetStatus.ACTIVE,
            version="Ubuntu 22.04",
            cpu_cores=4,
            memory_gb=8,
            storage_gb=100,
            notes="Test VM for development",
        )

        result = SoftwareAssetService.create(asset_data)

        assert result.id is not None
        assert result.name == "Test VM"
        assert result.type == SoftwareType.VM
        assert result.status == AssetStatus.ACTIVE
        assert result.version == "Ubuntu 22.04"
        assert result.cpu_cores == 4
        assert result.memory_gb == 8
        assert result.storage_gb == 100
        assert result.notes == "Test VM for development"
        assert result.hardware_host_id is None

    def test_create_software_asset_with_host(self, fresh_db):
        """Test creating software asset with hardware host"""
        # Create hardware host first
        hardware_data = HardwareAssetCreate(name="Host Server", type=HardwareType.SERVER)
        host = HardwareAssetService.create(hardware_data)

        asset_data = SoftwareAssetCreate(name="Hosted VM", type=SoftwareType.VM, hardware_host_id=host.id)

        result = SoftwareAssetService.create(asset_data)

        assert result.hardware_host_id == host.id and host.id is not None
        # Note: relationship loading happens within session context

    def test_create_software_asset_with_invalid_host(self, fresh_db):
        """Test creating software asset with non-existent host fails"""
        asset_data = SoftwareAssetCreate(name="Invalid Host VM", type=SoftwareType.VM, hardware_host_id=999)

        with pytest.raises(ValueError, match="Hardware host with ID 999 not found"):
            SoftwareAssetService.create(asset_data)

    def test_get_software_assets_by_host(self, fresh_db):
        """Test getting software assets by hardware host"""
        # Create hardware host
        hardware_data = HardwareAssetCreate(name="Host Server", type=HardwareType.SERVER)
        host = HardwareAssetService.create(hardware_data)

        # Create software assets
        vm1_data = SoftwareAssetCreate(name="VM 1", hardware_host_id=host.id)
        vm2_data = SoftwareAssetCreate(name="VM 2", hardware_host_id=host.id)
        vm3_data = SoftwareAssetCreate(name="VM 3")  # No host

        SoftwareAssetService.create(vm1_data)
        SoftwareAssetService.create(vm2_data)
        SoftwareAssetService.create(vm3_data)

        hosted_assets = SoftwareAssetService.get_by_host(host.id) if host.id is not None else []

        assert len(hosted_assets) == 2
        assert all(asset.hardware_host_id == host.id for asset in hosted_assets)

    def test_update_software_asset_host(self, fresh_db):
        """Test updating software asset host"""
        # Create hosts
        host1_data = HardwareAssetCreate(name="Host 1", type=HardwareType.SERVER)
        host2_data = HardwareAssetCreate(name="Host 2", type=HardwareType.SERVER)
        host1 = HardwareAssetService.create(host1_data)
        host2 = HardwareAssetService.create(host2_data)

        # Create software asset
        asset_data = SoftwareAssetCreate(name="Test VM", hardware_host_id=host1.id)
        created = SoftwareAssetService.create(asset_data)

        # Update to different host
        update_data = SoftwareAssetUpdate(hardware_host_id=host2.id)
        if created.id is not None:
            updated = SoftwareAssetService.update(created.id, update_data)

            assert updated is not None
            assert updated.hardware_host_id == host2.id
        # Note: relationship loading happens within session context

    def test_update_software_asset_invalid_host(self, fresh_db):
        """Test updating software asset with invalid host fails"""
        asset_data = SoftwareAssetCreate(name="Test VM")
        created = SoftwareAssetService.create(asset_data)

        update_data = SoftwareAssetUpdate(hardware_host_id=999)

        if created.id is not None:
            with pytest.raises(ValueError, match="Hardware host with ID 999 not found"):
                SoftwareAssetService.update(created.id, update_data)


class TestIPAllocationService:
    """Test IP allocation service functionality"""

    def test_create_ip_allocation(self, fresh_db):
        """Test creating a new IP allocation"""
        allocation_data = IPAllocationCreate(
            ip_address="192.168.1.10",
            subnet_mask="255.255.255.0",
            gateway="192.168.1.1",
            dns_primary="8.8.8.8",
            dns_secondary="8.8.4.4",
            vlan_id=100,
            description="Test allocation",
            is_static=True,
            is_active=True,
            notes="Test notes",
        )

        result = IPAllocationService.create(allocation_data)

        assert result.id is not None
        assert result.ip_address == "192.168.1.10"
        assert result.subnet_mask == "255.255.255.0"
        assert result.gateway == "192.168.1.1"
        assert result.dns_primary == "8.8.8.8"
        assert result.dns_secondary == "8.8.4.4"
        assert result.vlan_id == 100
        assert result.description == "Test allocation"
        assert result.is_static
        assert result.is_active
        assert result.notes == "Test notes"

    def test_create_ip_allocation_with_hardware_asset(self, fresh_db):
        """Test creating IP allocation assigned to hardware asset"""
        # Create hardware asset
        hardware_data = HardwareAssetCreate(name="Test Server", type=HardwareType.SERVER)
        hardware = HardwareAssetService.create(hardware_data)

        allocation_data = IPAllocationCreate(ip_address="10.0.0.5", hardware_asset_id=hardware.id)

        result = IPAllocationService.create(allocation_data)

        assert result.hardware_asset_id == hardware.id and hardware.id is not None
        assert result.software_asset_id is None
        # Note: relationship loading happens within session context

    def test_create_ip_allocation_with_software_asset(self, fresh_db):
        """Test creating IP allocation assigned to software asset"""
        # Create software asset
        software_data = SoftwareAssetCreate(name="Test VM", type=SoftwareType.VM)
        software = SoftwareAssetService.create(software_data)

        allocation_data = IPAllocationCreate(ip_address="172.16.0.10", software_asset_id=software.id)

        result = IPAllocationService.create(allocation_data)

        assert result.software_asset_id == software.id and software.id is not None
        assert result.hardware_asset_id is None
        # Note: relationship loading happens within session context

    def test_create_duplicate_ip_address(self, fresh_db):
        """Test creating duplicate IP address fails"""
        allocation1 = IPAllocationCreate(ip_address="192.168.1.100")
        allocation2 = IPAllocationCreate(ip_address="192.168.1.100")

        IPAllocationService.create(allocation1)

        with pytest.raises(ValueError, match="IP address 192.168.1.100 is already allocated"):
            IPAllocationService.create(allocation2)

    def test_create_invalid_ip_address(self, fresh_db):
        """Test creating allocation with invalid IP address fails"""
        allocation_data = IPAllocationCreate(ip_address="invalid.ip.address")

        with pytest.raises(ValueError, match="Invalid IP address"):
            IPAllocationService.create(allocation_data)

    def test_create_allocation_both_assets(self, fresh_db):
        """Test creating allocation with both hardware and software asset fails"""
        hardware_data = HardwareAssetCreate(name="Server", type=HardwareType.SERVER)
        software_data = SoftwareAssetCreate(name="VM", type=SoftwareType.VM)
        hardware = HardwareAssetService.create(hardware_data)
        software = SoftwareAssetService.create(software_data)

        allocation_data = IPAllocationCreate(
            ip_address="10.0.0.1", hardware_asset_id=hardware.id, software_asset_id=software.id
        )

        with pytest.raises(ValueError, match="IP allocation cannot be assigned to both hardware and software asset"):
            IPAllocationService.create(allocation_data)

    def test_create_allocation_invalid_hardware_asset(self, fresh_db):
        """Test creating allocation with invalid hardware asset fails"""
        allocation_data = IPAllocationCreate(ip_address="10.0.0.1", hardware_asset_id=999)

        with pytest.raises(ValueError, match="Hardware asset with ID 999 not found"):
            IPAllocationService.create(allocation_data)

    def test_create_allocation_invalid_software_asset(self, fresh_db):
        """Test creating allocation with invalid software asset fails"""
        allocation_data = IPAllocationCreate(ip_address="10.0.0.1", software_asset_id=999)

        with pytest.raises(ValueError, match="Software asset with ID 999 not found"):
            IPAllocationService.create(allocation_data)

    def test_update_ip_allocation(self, fresh_db):
        """Test updating IP allocation"""
        allocation_data = IPAllocationCreate(ip_address="192.168.1.10", description="Original")
        created = IPAllocationService.create(allocation_data)

        update_data = IPAllocationUpdate(description="Updated", is_active=False)

        if created.id is not None:
            updated = IPAllocationService.update(created.id, update_data)

            assert updated is not None
            assert updated.description == "Updated"
            assert not updated.is_active
            assert updated.ip_address == "192.168.1.10"  # Unchanged

    def test_update_ip_allocation_address(self, fresh_db):
        """Test updating IP allocation address"""
        allocation_data = IPAllocationCreate(ip_address="192.168.1.10")
        created = IPAllocationService.create(allocation_data)

        update_data = IPAllocationUpdate(ip_address="192.168.1.20")
        if created.id is not None:
            updated = IPAllocationService.update(created.id, update_data)

            assert updated is not None
            assert updated.ip_address == "192.168.1.20"

    def test_update_ip_allocation_duplicate_address(self, fresh_db):
        """Test updating to duplicate IP address fails"""
        allocation1 = IPAllocationCreate(ip_address="192.168.1.10")
        allocation2 = IPAllocationCreate(ip_address="192.168.1.20")

        IPAllocationService.create(allocation1)
        created2 = IPAllocationService.create(allocation2)

        update_data = IPAllocationUpdate(ip_address="192.168.1.10")

        if created2.id is not None:
            with pytest.raises(ValueError, match="IP address 192.168.1.10 is already allocated"):
                IPAllocationService.update(created2.id, update_data)

    def test_get_allocations_by_hardware_asset(self, fresh_db):
        """Test getting IP allocations by hardware asset"""
        hardware_data = HardwareAssetCreate(name="Server", type=HardwareType.SERVER)
        hardware = HardwareAssetService.create(hardware_data)

        allocation1 = IPAllocationCreate(ip_address="10.0.0.1", hardware_asset_id=hardware.id)
        allocation2 = IPAllocationCreate(ip_address="10.0.0.2", hardware_asset_id=hardware.id)
        allocation3 = IPAllocationCreate(ip_address="10.0.0.3")  # Unassigned

        IPAllocationService.create(allocation1)
        IPAllocationService.create(allocation2)
        IPAllocationService.create(allocation3)

        allocations = IPAllocationService.get_by_hardware_asset(hardware.id) if hardware.id is not None else []

        assert len(allocations) == 2
        assert all(alloc.hardware_asset_id == hardware.id for alloc in allocations)

    def test_get_allocations_by_software_asset(self, fresh_db):
        """Test getting IP allocations by software asset"""
        software_data = SoftwareAssetCreate(name="VM", type=SoftwareType.VM)
        software = SoftwareAssetService.create(software_data)

        allocation1 = IPAllocationCreate(ip_address="172.16.0.1", software_asset_id=software.id)
        allocation2 = IPAllocationCreate(ip_address="172.16.0.2", software_asset_id=software.id)
        allocation3 = IPAllocationCreate(ip_address="172.16.0.3")  # Unassigned

        IPAllocationService.create(allocation1)
        IPAllocationService.create(allocation2)
        IPAllocationService.create(allocation3)

        allocations = IPAllocationService.get_by_software_asset(software.id) if software.id is not None else []

        assert len(allocations) == 2
        assert all(alloc.software_asset_id == software.id for alloc in allocations)

    def test_get_unallocated_ips(self, fresh_db):
        """Test getting unallocated IP addresses"""
        hardware_data = HardwareAssetCreate(name="Server", type=HardwareType.SERVER)
        hardware = HardwareAssetService.create(hardware_data)

        allocation1 = IPAllocationCreate(ip_address="10.0.0.1", hardware_asset_id=hardware.id)
        allocation2 = IPAllocationCreate(ip_address="10.0.0.2")  # Unassigned
        allocation3 = IPAllocationCreate(ip_address="10.0.0.3")  # Unassigned

        IPAllocationService.create(allocation1)
        IPAllocationService.create(allocation2)
        IPAllocationService.create(allocation3)

        unallocated = IPAllocationService.get_unallocated()

        assert len(unallocated) == 2
        assert all(alloc.hardware_asset_id is None and alloc.software_asset_id is None for alloc in unallocated)


class TestDashboardService:
    """Test dashboard service functionality"""

    def test_get_statistics_empty(self, fresh_db):
        """Test getting statistics with no data"""
        stats = DashboardService.get_statistics()

        assert stats["hardware"]["total"] == 0
        assert stats["hardware"]["active"] == 0
        assert stats["hardware"]["by_type"] == {}
        assert stats["software"]["total"] == 0
        assert stats["software"]["active"] == 0
        assert stats["software"]["by_type"] == {}
        assert stats["ip_allocations"]["total"] == 0
        assert stats["ip_allocations"]["active"] == 0
        assert stats["ip_allocations"]["allocated"] == 0
        assert stats["ip_allocations"]["available"] == 0

    def test_get_statistics_with_data(self, fresh_db):
        """Test getting statistics with sample data"""
        # Create hardware assets
        server_data = HardwareAssetCreate(name="Server 1", type=HardwareType.SERVER, status=AssetStatus.ACTIVE)
        switch_data = HardwareAssetCreate(name="Switch 1", type=HardwareType.SWITCH, status=AssetStatus.INACTIVE)
        router_data = HardwareAssetCreate(name="Router 1", type=HardwareType.ROUTER, status=AssetStatus.ACTIVE)

        server = HardwareAssetService.create(server_data)
        HardwareAssetService.create(switch_data)
        HardwareAssetService.create(router_data)

        # Create software assets
        vm_data = SoftwareAssetCreate(name="VM 1", type=SoftwareType.VM, status=AssetStatus.ACTIVE)
        container_data = SoftwareAssetCreate(name="Container 1", type=SoftwareType.CONTAINER, status=AssetStatus.ACTIVE)

        vm = SoftwareAssetService.create(vm_data)
        SoftwareAssetService.create(container_data)

        # Create IP allocations
        allocation1 = IPAllocationCreate(ip_address="10.0.0.1", hardware_asset_id=server.id, is_active=True)
        allocation2 = IPAllocationCreate(ip_address="10.0.0.2", software_asset_id=vm.id, is_active=True)
        allocation3 = IPAllocationCreate(ip_address="10.0.0.3", is_active=False)  # Unassigned, inactive
        allocation4 = IPAllocationCreate(ip_address="10.0.0.4")  # Unassigned, active

        IPAllocationService.create(allocation1)
        IPAllocationService.create(allocation2)
        IPAllocationService.create(allocation3)
        IPAllocationService.create(allocation4)

        stats = DashboardService.get_statistics()

        # Hardware statistics
        assert stats["hardware"]["total"] == 3
        assert stats["hardware"]["active"] == 2
        assert stats["hardware"]["by_type"] == {"server": 1, "switch": 1, "router": 1}

        # Software statistics
        assert stats["software"]["total"] == 2
        assert stats["software"]["active"] == 2
        assert stats["software"]["by_type"] == {"vm": 1, "container": 1}

        # IP allocation statistics
        assert stats["ip_allocations"]["total"] == 4
        assert stats["ip_allocations"]["active"] == 3  # allocation3 is inactive
        assert stats["ip_allocations"]["allocated"] == 2  # allocation1, allocation2
        assert stats["ip_allocations"]["available"] == 2  # allocation3, allocation4
