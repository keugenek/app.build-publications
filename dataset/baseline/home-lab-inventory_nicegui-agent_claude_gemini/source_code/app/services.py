from typing import List, Optional
from sqlmodel import select
from datetime import datetime
import ipaddress

from app.database import get_session
from app.models import (
    HardwareAsset,
    SoftwareAsset,
    IPAllocation,
    HardwareAssetCreate,
    HardwareAssetUpdate,
    SoftwareAssetCreate,
    SoftwareAssetUpdate,
    IPAllocationCreate,
    IPAllocationUpdate,
    AssetStatus,
)


class HardwareAssetService:
    """Service for managing hardware assets"""

    @staticmethod
    def get_all() -> List[HardwareAsset]:
        with get_session() as session:
            statement = select(HardwareAsset).order_by(HardwareAsset.name)
            return list(session.exec(statement))

    @staticmethod
    def get_by_id(asset_id: int) -> Optional[HardwareAsset]:
        with get_session() as session:
            return session.get(HardwareAsset, asset_id)

    @staticmethod
    def create(asset_data: HardwareAssetCreate) -> HardwareAsset:
        with get_session() as session:
            asset = HardwareAsset(**asset_data.model_dump())
            session.add(asset)
            session.commit()
            session.refresh(asset)
            return asset

    @staticmethod
    def update(asset_id: int, asset_data: HardwareAssetUpdate) -> Optional[HardwareAsset]:
        with get_session() as session:
            asset = session.get(HardwareAsset, asset_id)
            if asset is None:
                return None

            update_data = asset_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(asset, field, value)

            asset.updated_at = datetime.utcnow()
            session.add(asset)
            session.commit()
            session.refresh(asset)
            return asset

    @staticmethod
    def delete(asset_id: int) -> bool:
        with get_session() as session:
            asset = session.get(HardwareAsset, asset_id)
            if asset is None:
                return False

            session.delete(asset)
            session.commit()
            return True

    @staticmethod
    def get_by_status(status: AssetStatus) -> List[HardwareAsset]:
        with get_session() as session:
            statement = select(HardwareAsset).where(HardwareAsset.status == status)
            return list(session.exec(statement))


class SoftwareAssetService:
    """Service for managing software assets"""

    @staticmethod
    def get_all() -> List[SoftwareAsset]:
        with get_session() as session:
            statement = select(SoftwareAsset).order_by(SoftwareAsset.name)
            return list(session.exec(statement))

    @staticmethod
    def get_by_id(asset_id: int) -> Optional[SoftwareAsset]:
        with get_session() as session:
            return session.get(SoftwareAsset, asset_id)

    @staticmethod
    def create(asset_data: SoftwareAssetCreate) -> SoftwareAsset:
        with get_session() as session:
            # Validate hardware host exists if specified
            if asset_data.hardware_host_id is not None:
                host = session.get(HardwareAsset, asset_data.hardware_host_id)
                if host is None:
                    raise ValueError(f"Hardware host with ID {asset_data.hardware_host_id} not found")

            asset = SoftwareAsset(**asset_data.model_dump())
            session.add(asset)
            session.commit()
            session.refresh(asset)

            # Ensure relationships are loaded
            if asset.hardware_host_id is not None:
                asset.hardware_host  # Access to load relationship

            return asset

    @staticmethod
    def update(asset_id: int, asset_data: SoftwareAssetUpdate) -> Optional[SoftwareAsset]:
        with get_session() as session:
            asset = session.get(SoftwareAsset, asset_id)
            if asset is None:
                return None

            # Validate hardware host exists if specified
            update_data = asset_data.model_dump(exclude_unset=True)
            if "hardware_host_id" in update_data and update_data["hardware_host_id"] is not None:
                host = session.get(HardwareAsset, update_data["hardware_host_id"])
                if host is None:
                    raise ValueError(f"Hardware host with ID {update_data['hardware_host_id']} not found")

            for field, value in update_data.items():
                setattr(asset, field, value)

            asset.updated_at = datetime.utcnow()
            session.add(asset)
            session.commit()
            session.refresh(asset)
            return asset

    @staticmethod
    def delete(asset_id: int) -> bool:
        with get_session() as session:
            asset = session.get(SoftwareAsset, asset_id)
            if asset is None:
                return False

            session.delete(asset)
            session.commit()
            return True

    @staticmethod
    def get_by_host(hardware_host_id: int) -> List[SoftwareAsset]:
        with get_session() as session:
            statement = select(SoftwareAsset).where(SoftwareAsset.hardware_host_id == hardware_host_id)
            return list(session.exec(statement))


class IPAllocationService:
    """Service for managing IP allocations"""

    @staticmethod
    def get_all() -> List[IPAllocation]:
        with get_session() as session:
            statement = select(IPAllocation).order_by(IPAllocation.ip_address)
            return list(session.exec(statement))

    @staticmethod
    def get_by_id(allocation_id: int) -> Optional[IPAllocation]:
        with get_session() as session:
            return session.get(IPAllocation, allocation_id)

    @staticmethod
    def create(allocation_data: IPAllocationCreate) -> IPAllocation:
        with get_session() as session:
            # Validate IP address format
            try:
                ipaddress.ip_address(allocation_data.ip_address)
            except ValueError as e:
                raise ValueError(f"Invalid IP address: {e}")

            # Check if IP is already allocated
            existing = session.exec(
                select(IPAllocation).where(IPAllocation.ip_address == allocation_data.ip_address)
            ).first()
            if existing is not None:
                raise ValueError(f"IP address {allocation_data.ip_address} is already allocated")

            # Validate that only one asset is specified
            if allocation_data.hardware_asset_id is not None and allocation_data.software_asset_id is not None:
                raise ValueError("IP allocation cannot be assigned to both hardware and software asset")

            # Validate assets exist if specified
            if allocation_data.hardware_asset_id is not None:
                asset = session.get(HardwareAsset, allocation_data.hardware_asset_id)
                if asset is None:
                    raise ValueError(f"Hardware asset with ID {allocation_data.hardware_asset_id} not found")

            if allocation_data.software_asset_id is not None:
                asset = session.get(SoftwareAsset, allocation_data.software_asset_id)
                if asset is None:
                    raise ValueError(f"Software asset with ID {allocation_data.software_asset_id} not found")

            allocation = IPAllocation(**allocation_data.model_dump())
            session.add(allocation)
            session.commit()
            session.refresh(allocation)

            # Ensure relationships are loaded
            if allocation.hardware_asset_id is not None:
                allocation.hardware_asset  # Access to load relationship
            if allocation.software_asset_id is not None:
                allocation.software_asset  # Access to load relationship

            return allocation

    @staticmethod
    def update(allocation_id: int, allocation_data: IPAllocationUpdate) -> Optional[IPAllocation]:
        with get_session() as session:
            allocation = session.get(IPAllocation, allocation_id)
            if allocation is None:
                return None

            update_data = allocation_data.model_dump(exclude_unset=True)

            # Validate IP address format if being updated
            if "ip_address" in update_data:
                try:
                    ipaddress.ip_address(update_data["ip_address"])
                except ValueError as e:
                    raise ValueError(f"Invalid IP address: {e}")

                # Check if new IP is already allocated (excluding current allocation)
                existing = session.exec(
                    select(IPAllocation).where(
                        IPAllocation.ip_address == update_data["ip_address"], IPAllocation.id != allocation_id
                    )
                ).first()
                if existing is not None:
                    raise ValueError(f"IP address {update_data['ip_address']} is already allocated")

            # Validate assets if being updated
            if "hardware_asset_id" in update_data and update_data["hardware_asset_id"] is not None:
                asset = session.get(HardwareAsset, update_data["hardware_asset_id"])
                if asset is None:
                    raise ValueError(f"Hardware asset with ID {update_data['hardware_asset_id']} not found")

            if "software_asset_id" in update_data and update_data["software_asset_id"] is not None:
                asset = session.get(SoftwareAsset, update_data["software_asset_id"])
                if asset is None:
                    raise ValueError(f"Software asset with ID {update_data['software_asset_id']} not found")

            for field, value in update_data.items():
                setattr(allocation, field, value)

            allocation.updated_at = datetime.utcnow()
            session.add(allocation)
            session.commit()
            session.refresh(allocation)
            return allocation

    @staticmethod
    def delete(allocation_id: int) -> bool:
        with get_session() as session:
            allocation = session.get(IPAllocation, allocation_id)
            if allocation is None:
                return False

            session.delete(allocation)
            session.commit()
            return True

    @staticmethod
    def get_by_hardware_asset(hardware_asset_id: int) -> List[IPAllocation]:
        with get_session() as session:
            statement = select(IPAllocation).where(IPAllocation.hardware_asset_id == hardware_asset_id)
            return list(session.exec(statement))

    @staticmethod
    def get_by_software_asset(software_asset_id: int) -> List[IPAllocation]:
        with get_session() as session:
            statement = select(IPAllocation).where(IPAllocation.software_asset_id == software_asset_id)
            return list(session.exec(statement))

    @staticmethod
    def get_unallocated() -> List[IPAllocation]:
        """Get IP allocations not assigned to any asset"""
        with get_session() as session:
            statement = select(IPAllocation).where(
                IPAllocation.hardware_asset_id == None,  # noqa: E711
                IPAllocation.software_asset_id == None,  # noqa: E711
            )
            return list(session.exec(statement))


class DashboardService:
    """Service for dashboard statistics and overview"""

    @staticmethod
    def get_statistics() -> dict:
        with get_session() as session:
            # Hardware asset counts
            total_hardware = session.exec(select(HardwareAsset)).all()
            active_hardware = session.exec(
                select(HardwareAsset).where(HardwareAsset.status == AssetStatus.ACTIVE)
            ).all()

            # Software asset counts
            total_software = session.exec(select(SoftwareAsset)).all()
            active_software = session.exec(
                select(SoftwareAsset).where(SoftwareAsset.status == AssetStatus.ACTIVE)
            ).all()

            # IP allocation counts
            total_ips = session.exec(select(IPAllocation)).all()
            active_ips = session.exec(select(IPAllocation).where(IPAllocation.is_active)).all()
            allocated_ips = session.exec(
                select(IPAllocation).where(
                    (IPAllocation.hardware_asset_id != None)  # noqa: E711
                    | (IPAllocation.software_asset_id != None)  # noqa: E711
                )
            ).all()

            # Hardware type breakdown
            hardware_by_type = {}
            for asset in total_hardware:
                asset_type = asset.type.value
                hardware_by_type[asset_type] = hardware_by_type.get(asset_type, 0) + 1

            # Software type breakdown
            software_by_type = {}
            for asset in total_software:
                asset_type = asset.type.value
                software_by_type[asset_type] = software_by_type.get(asset_type, 0) + 1

            return {
                "hardware": {"total": len(total_hardware), "active": len(active_hardware), "by_type": hardware_by_type},
                "software": {"total": len(total_software), "active": len(active_software), "by_type": software_by_type},
                "ip_allocations": {
                    "total": len(total_ips),
                    "active": len(active_ips),
                    "allocated": len(allocated_ips),
                    "available": len(total_ips) - len(allocated_ips),
                },
            }
