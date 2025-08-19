from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
from enum import Enum


# Enums for asset types and statuses
class HardwareType(str, Enum):
    SERVER = "server"
    SWITCH = "switch"
    ROUTER = "router"
    FIREWALL = "firewall"
    NAS = "nas"
    UPS = "ups"
    OTHER = "other"


class SoftwareType(str, Enum):
    VM = "vm"
    CONTAINER = "container"
    SERVICE = "service"
    APPLICATION = "application"
    OTHER = "other"


class AssetStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    DECOMMISSIONED = "decommissioned"


# Persistent models (stored in database)
class HardwareAsset(SQLModel, table=True):
    __tablename__ = "hardware_assets"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    type: HardwareType = Field(default=HardwareType.SERVER)
    status: AssetStatus = Field(default=AssetStatus.ACTIVE)
    manufacturer: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)
    serial_number: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    software_assets: List["SoftwareAsset"] = Relationship(back_populates="hardware_host")
    ip_allocations: List["IPAllocation"] = Relationship(back_populates="hardware_asset")


class SoftwareAsset(SQLModel, table=True):
    __tablename__ = "software_assets"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    type: SoftwareType = Field(default=SoftwareType.VM)
    status: AssetStatus = Field(default=AssetStatus.ACTIVE)
    version: Optional[str] = Field(default=None, max_length=50)
    hardware_host_id: Optional[int] = Field(default=None, foreign_key="hardware_assets.id")
    cpu_cores: Optional[int] = Field(default=None, ge=1)
    memory_gb: Optional[int] = Field(default=None, ge=1)
    storage_gb: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    hardware_host: Optional[HardwareAsset] = Relationship(back_populates="software_assets")
    ip_allocations: List["IPAllocation"] = Relationship(back_populates="software_asset")


class IPAllocation(SQLModel, table=True):
    __tablename__ = "ip_allocations"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    ip_address: str = Field(max_length=45, unique=True)  # IPv4 or IPv6
    subnet_mask: Optional[str] = Field(default=None, max_length=45)
    gateway: Optional[str] = Field(default=None, max_length=45)
    dns_primary: Optional[str] = Field(default=None, max_length=45)
    dns_secondary: Optional[str] = Field(default=None, max_length=45)
    vlan_id: Optional[int] = Field(default=None, ge=1, le=4094)
    description: Optional[str] = Field(default=None, max_length=200)

    # Foreign keys - either hardware or software asset, not both
    hardware_asset_id: Optional[int] = Field(default=None, foreign_key="hardware_assets.id")
    software_asset_id: Optional[int] = Field(default=None, foreign_key="software_assets.id")

    is_static: bool = Field(default=True)
    is_active: bool = Field(default=True)
    notes: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    hardware_asset: Optional[HardwareAsset] = Relationship(back_populates="ip_allocations")
    software_asset: Optional[SoftwareAsset] = Relationship(back_populates="ip_allocations")


# Non-persistent schemas (for validation, forms, API requests/responses)
class HardwareAssetCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    type: HardwareType = Field(default=HardwareType.SERVER)
    status: AssetStatus = Field(default=AssetStatus.ACTIVE)
    manufacturer: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)
    serial_number: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)


class HardwareAssetUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    type: Optional[HardwareType] = Field(default=None)
    status: Optional[AssetStatus] = Field(default=None)
    manufacturer: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)
    serial_number: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)


class SoftwareAssetCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    type: SoftwareType = Field(default=SoftwareType.VM)
    status: AssetStatus = Field(default=AssetStatus.ACTIVE)
    version: Optional[str] = Field(default=None, max_length=50)
    hardware_host_id: Optional[int] = Field(default=None)
    cpu_cores: Optional[int] = Field(default=None, ge=1)
    memory_gb: Optional[int] = Field(default=None, ge=1)
    storage_gb: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = Field(default=None, max_length=1000)


class SoftwareAssetUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    type: Optional[SoftwareType] = Field(default=None)
    status: Optional[AssetStatus] = Field(default=None)
    version: Optional[str] = Field(default=None, max_length=50)
    hardware_host_id: Optional[int] = Field(default=None)
    cpu_cores: Optional[int] = Field(default=None, ge=1)
    memory_gb: Optional[int] = Field(default=None, ge=1)
    storage_gb: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = Field(default=None, max_length=1000)


class IPAllocationCreate(SQLModel, table=False):
    ip_address: str = Field(max_length=45)
    subnet_mask: Optional[str] = Field(default=None, max_length=45)
    gateway: Optional[str] = Field(default=None, max_length=45)
    dns_primary: Optional[str] = Field(default=None, max_length=45)
    dns_secondary: Optional[str] = Field(default=None, max_length=45)
    vlan_id: Optional[int] = Field(default=None, ge=1, le=4094)
    description: Optional[str] = Field(default=None, max_length=200)
    hardware_asset_id: Optional[int] = Field(default=None)
    software_asset_id: Optional[int] = Field(default=None)
    is_static: bool = Field(default=True)
    is_active: bool = Field(default=True)
    notes: Optional[str] = Field(default=None, max_length=1000)


class IPAllocationUpdate(SQLModel, table=False):
    ip_address: Optional[str] = Field(default=None, max_length=45)
    subnet_mask: Optional[str] = Field(default=None, max_length=45)
    gateway: Optional[str] = Field(default=None, max_length=45)
    dns_primary: Optional[str] = Field(default=None, max_length=45)
    dns_secondary: Optional[str] = Field(default=None, max_length=45)
    vlan_id: Optional[int] = Field(default=None, ge=1, le=4094)
    description: Optional[str] = Field(default=None, max_length=200)
    hardware_asset_id: Optional[int] = Field(default=None)
    software_asset_id: Optional[int] = Field(default=None)
    is_static: Optional[bool] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=1000)
