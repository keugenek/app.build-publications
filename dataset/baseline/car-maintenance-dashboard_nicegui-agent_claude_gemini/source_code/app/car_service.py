from typing import Optional, List
from sqlmodel import select, desc
from app.database import get_session
from app.models import (
    Car,
    CarCreate,
    CarUpdate,
    MaintenanceRecord,
    MaintenanceRecordCreate,
    MaintenanceRecordUpdate,
    ServiceSchedule,
    ServiceScheduleCreate,
    ServiceScheduleUpdate,
)


class CarService:
    """Service layer for car operations"""

    @staticmethod
    def create_car(car_data: CarCreate) -> Car:
        """Create a new car"""
        with get_session() as session:
            car = Car(**car_data.model_dump())
            session.add(car)
            session.commit()
            session.refresh(car)
            return car

    @staticmethod
    def get_all_cars() -> List[Car]:
        """Get all cars ordered by make, model, year"""
        with get_session() as session:
            statement = select(Car).order_by(Car.make, Car.model, Car.year)  # type: ignore[arg-type]
            cars = session.exec(statement).all()
            return list(cars)

    @staticmethod
    def get_car_by_id(car_id: int) -> Optional[Car]:
        """Get a car by ID"""
        with get_session() as session:
            return session.get(Car, car_id)

    @staticmethod
    def update_car(car_id: int, car_data: CarUpdate) -> Optional[Car]:
        """Update an existing car"""
        with get_session() as session:
            car = session.get(Car, car_id)
            if car is None:
                return None

            update_data = car_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(car, field, value)

            session.add(car)
            session.commit()
            session.refresh(car)
            return car

    @staticmethod
    def delete_car(car_id: int) -> bool:
        """Delete a car and all its records"""
        with get_session() as session:
            car = session.get(Car, car_id)
            if car is None:
                return False

            session.delete(car)
            session.commit()
            return True


class MaintenanceService:
    """Service layer for maintenance record operations"""

    @staticmethod
    def create_record(record_data: MaintenanceRecordCreate) -> Optional[MaintenanceRecord]:
        """Create a new maintenance record"""
        with get_session() as session:
            # Verify car exists
            car = session.get(Car, record_data.car_id)
            if car is None:
                return None

            record = MaintenanceRecord(**record_data.model_dump())
            session.add(record)
            session.commit()
            session.refresh(record)
            return record

    @staticmethod
    def get_records_by_car(car_id: int) -> List[MaintenanceRecord]:
        """Get all maintenance records for a car, ordered by date (newest first)"""
        with get_session() as session:
            statement = (
                select(MaintenanceRecord)
                .where(MaintenanceRecord.car_id == car_id)
                .order_by(desc(MaintenanceRecord.service_date))
            )
            records = session.exec(statement).all()
            return list(records)

    @staticmethod
    def get_record_by_id(record_id: int) -> Optional[MaintenanceRecord]:
        """Get a maintenance record by ID"""
        with get_session() as session:
            return session.get(MaintenanceRecord, record_id)

    @staticmethod
    def update_record(record_id: int, record_data: MaintenanceRecordUpdate) -> Optional[MaintenanceRecord]:
        """Update an existing maintenance record"""
        with get_session() as session:
            record = session.get(MaintenanceRecord, record_id)
            if record is None:
                return None

            update_data = record_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(record, field, value)

            session.add(record)
            session.commit()
            session.refresh(record)
            return record

    @staticmethod
    def delete_record(record_id: int) -> bool:
        """Delete a maintenance record"""
        with get_session() as session:
            record = session.get(MaintenanceRecord, record_id)
            if record is None:
                return False

            session.delete(record)
            session.commit()
            return True

    @staticmethod
    def get_latest_mileage(car_id: int) -> Optional[int]:
        """Get the latest mileage recorded for a car"""
        with get_session() as session:
            statement = (
                select(MaintenanceRecord.mileage)
                .where(MaintenanceRecord.car_id == car_id)
                .order_by(desc(MaintenanceRecord.service_date), desc(MaintenanceRecord.mileage))
                .limit(1)
            )
            result = session.exec(statement).first()
            return result


class ServiceScheduleService:
    """Service layer for service schedule operations"""

    @staticmethod
    def create_schedule(schedule_data: ServiceScheduleCreate) -> Optional[ServiceSchedule]:
        """Create a new service schedule"""
        with get_session() as session:
            # Verify car exists
            car = session.get(Car, schedule_data.car_id)
            if car is None:
                return None

            schedule = ServiceSchedule(**schedule_data.model_dump())
            session.add(schedule)
            session.commit()
            session.refresh(schedule)
            return schedule

    @staticmethod
    def get_schedules_by_car(car_id: int) -> List[ServiceSchedule]:
        """Get all service schedules for a car, ordered by next service date"""
        with get_session() as session:
            statement = (
                select(ServiceSchedule)
                .where(ServiceSchedule.car_id == car_id)
                .order_by(ServiceSchedule.next_service_date)  # type: ignore[arg-type]
            )
            schedules = session.exec(statement).all()
            return list(schedules)

    @staticmethod
    def get_schedule_by_id(schedule_id: int) -> Optional[ServiceSchedule]:
        """Get a service schedule by ID"""
        with get_session() as session:
            return session.get(ServiceSchedule, schedule_id)

    @staticmethod
    def update_schedule(schedule_id: int, schedule_data: ServiceScheduleUpdate) -> Optional[ServiceSchedule]:
        """Update an existing service schedule"""
        with get_session() as session:
            schedule = session.get(ServiceSchedule, schedule_id)
            if schedule is None:
                return None

            update_data = schedule_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(schedule, field, value)

            session.add(schedule)
            session.commit()
            session.refresh(schedule)
            return schedule

    @staticmethod
    def delete_schedule(schedule_id: int) -> bool:
        """Delete a service schedule"""
        with get_session() as session:
            schedule = session.get(ServiceSchedule, schedule_id)
            if schedule is None:
                return False

            session.delete(schedule)
            session.commit()
            return True

    @staticmethod
    def get_upcoming_services() -> List[ServiceSchedule]:
        """Get all upcoming service schedules, ordered by next service date"""
        with get_session() as session:
            statement = (
                select(ServiceSchedule).order_by(ServiceSchedule.next_service_date)  # type: ignore[arg-type]
            )
            schedules = session.exec(statement).all()
            return list(schedules)
