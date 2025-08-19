import pytest
from decimal import Decimal
from datetime import date, datetime
from app.database import reset_db
from app.car_service import CarService, MaintenanceService, ServiceScheduleService
from app.models import (
    CarCreate,
    CarUpdate,
    MaintenanceRecordCreate,
    MaintenanceRecordUpdate,
    ServiceScheduleCreate,
    ServiceScheduleUpdate,
)


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestCarService:
    """Test the CarService functionality"""

    def test_create_car(self, new_db):
        car_data = CarCreate(make="Toyota", model="Camry", year=2020)
        car = CarService.create_car(car_data)

        assert car is not None
        assert car.id is not None
        assert car.make == "Toyota"
        assert car.model == "Camry"
        assert car.year == 2020
        assert isinstance(car.created_at, datetime)

    def test_get_all_cars_empty(self, new_db):
        cars = CarService.get_all_cars()
        assert cars == []

    def test_get_all_cars_with_data(self, new_db):
        # Create multiple cars
        car1_data = CarCreate(make="Toyota", model="Camry", year=2020)
        car2_data = CarCreate(make="Honda", model="Civic", year=2019)
        car3_data = CarCreate(make="Toyota", model="Corolla", year=2021)

        CarService.create_car(car1_data)
        CarService.create_car(car2_data)
        CarService.create_car(car3_data)

        cars = CarService.get_all_cars()
        assert len(cars) == 3

        # Should be ordered by make, model, year
        assert cars[0].make == "Honda"
        assert cars[1].make == "Toyota" and cars[1].model == "Camry"
        assert cars[2].make == "Toyota" and cars[2].model == "Corolla"

    def test_get_car_by_id_existing(self, new_db):
        car_data = CarCreate(make="Ford", model="F-150", year=2022)
        created_car = CarService.create_car(car_data)

        if created_car.id is not None:
            retrieved_car = CarService.get_car_by_id(created_car.id)
            assert retrieved_car is not None
            assert retrieved_car.id == created_car.id
            assert retrieved_car.make == "Ford"

    def test_get_car_by_id_nonexistent(self, new_db):
        car = CarService.get_car_by_id(999)
        assert car is None

    def test_update_car_existing(self, new_db):
        car_data = CarCreate(make="Nissan", model="Altima", year=2018)
        created_car = CarService.create_car(car_data)

        if created_car.id is not None:
            update_data = CarUpdate(year=2019)
            updated_car = CarService.update_car(created_car.id, update_data)

            assert updated_car is not None
            assert updated_car.make == "Nissan"  # Unchanged
            assert updated_car.model == "Altima"  # Unchanged
            assert updated_car.year == 2019  # Updated

    def test_update_car_nonexistent(self, new_db):
        update_data = CarUpdate(year=2019)
        result = CarService.update_car(999, update_data)
        assert result is None

    def test_delete_car_existing(self, new_db):
        car_data = CarCreate(make="BMW", model="X5", year=2021)
        created_car = CarService.create_car(car_data)

        if created_car.id is not None:
            result = CarService.delete_car(created_car.id)
            assert result is True

            # Verify car is deleted
            deleted_car = CarService.get_car_by_id(created_car.id)
            assert deleted_car is None

    def test_delete_car_nonexistent(self, new_db):
        result = CarService.delete_car(999)
        assert result is False


class TestMaintenanceService:
    """Test the MaintenanceService functionality"""

    def test_create_record_valid_car(self, new_db):
        # Create a car first
        car_data = CarCreate(make="Toyota", model="Prius", year=2020)
        car = CarService.create_car(car_data)

        assert car.id is not None
        record_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 6, 15),
            service_type="Oil Change",
            cost=Decimal("45.99"),
            mileage=25000,
            notes="Regular maintenance",
        )

        record = MaintenanceService.create_record(record_data)
        assert record is not None
        assert record.id is not None
        assert record.car_id == car.id
        assert record.service_type == "Oil Change"
        assert record.cost == Decimal("45.99")
        assert record.mileage == 25000

    def test_create_record_invalid_car(self, new_db):
        record_data = MaintenanceRecordCreate(
            car_id=999,  # Non-existent car
            service_date=date(2023, 6, 15),
            service_type="Oil Change",
            cost=Decimal("45.99"),
            mileage=25000,
            notes="",
        )

        record = MaintenanceService.create_record(record_data)
        assert record is None

    def test_get_records_by_car_empty(self, new_db):
        # Create a car but no records
        car_data = CarCreate(make="Honda", model="Accord", year=2019)
        car = CarService.create_car(car_data)

        if car.id is not None:
            records = MaintenanceService.get_records_by_car(car.id)
            assert records == []

    def test_get_records_by_car_with_data(self, new_db):
        # Create a car
        car_data = CarCreate(make="Ford", model="Focus", year=2018)
        car = CarService.create_car(car_data)

        assert car.id is not None

        # Create multiple records
        record1_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 1, 15),
            service_type="Oil Change",
            cost=Decimal("45.99"),
            mileage=20000,
        )
        record2_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 6, 15),
            service_type="Tire Rotation",
            cost=Decimal("75.00"),
            mileage=25000,
        )

        MaintenanceService.create_record(record1_data)
        MaintenanceService.create_record(record2_data)

        records = MaintenanceService.get_records_by_car(car.id)
        assert len(records) == 2

        # Should be ordered by date (newest first)
        assert records[0].service_date == date(2023, 6, 15)
        assert records[1].service_date == date(2023, 1, 15)

    def test_update_record_existing(self, new_db):
        # Create a car and record
        car_data = CarCreate(make="Mazda", model="CX-5", year=2020)
        car = CarService.create_car(car_data)

        assert car.id is not None
        record_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 6, 15),
            service_type="Oil Change",
            cost=Decimal("45.99"),
            mileage=25000,
        )
        record = MaintenanceService.create_record(record_data)

        assert record is not None and record.id is not None

        # Update the record
        update_data = MaintenanceRecordUpdate(cost=Decimal("50.00"), notes="Updated cost")
        updated_record = MaintenanceService.update_record(record.id, update_data)

        assert updated_record is not None
        assert updated_record.cost == Decimal("50.00")
        assert updated_record.notes == "Updated cost"
        assert updated_record.service_type == "Oil Change"  # Unchanged

    def test_update_record_nonexistent(self, new_db):
        update_data = MaintenanceRecordUpdate(cost=Decimal("50.00"))
        result = MaintenanceService.update_record(999, update_data)
        assert result is None

    def test_get_latest_mileage(self, new_db):
        # Create a car
        car_data = CarCreate(make="Subaru", model="Outback", year=2021)
        car = CarService.create_car(car_data)

        assert car.id is not None

        # Create multiple records with different mileages
        record1_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 1, 15),
            service_type="Oil Change",
            cost=Decimal("45.99"),
            mileage=20000,
        )
        record2_data = MaintenanceRecordCreate(
            car_id=car.id,
            service_date=date(2023, 6, 15),
            service_type="Tire Rotation",
            cost=Decimal("75.00"),
            mileage=25000,  # Latest mileage
        )

        MaintenanceService.create_record(record1_data)
        MaintenanceService.create_record(record2_data)

        latest_mileage = MaintenanceService.get_latest_mileage(car.id)
        assert latest_mileage == 25000

    def test_get_latest_mileage_no_records(self, new_db):
        car_data = CarCreate(make="Volvo", model="XC90", year=2022)
        car = CarService.create_car(car_data)

        if car.id is not None:
            latest_mileage = MaintenanceService.get_latest_mileage(car.id)
            assert latest_mileage is None


class TestServiceScheduleService:
    """Test the ServiceScheduleService functionality"""

    def test_create_schedule_valid_car(self, new_db):
        # Create a car first
        car_data = CarCreate(make="Audi", model="A4", year=2021)
        car = CarService.create_car(car_data)

        assert car.id is not None
        schedule_data = ServiceScheduleCreate(
            car_id=car.id,
            next_service_date=date(2023, 12, 15),
            next_service_mileage=30000,
            service_type="Oil Change",
            notes="Every 6 months",
        )

        schedule = ServiceScheduleService.create_schedule(schedule_data)
        assert schedule is not None
        assert schedule.id is not None
        assert schedule.car_id == car.id
        assert schedule.service_type == "Oil Change"
        assert schedule.next_service_mileage == 30000

    def test_create_schedule_invalid_car(self, new_db):
        schedule_data = ServiceScheduleCreate(
            car_id=999,  # Non-existent car
            next_service_date=date(2023, 12, 15),
            next_service_mileage=30000,
            service_type="Oil Change",
        )

        schedule = ServiceScheduleService.create_schedule(schedule_data)
        assert schedule is None

    def test_get_schedules_by_car(self, new_db):
        # Create a car
        car_data = CarCreate(make="Mercedes", model="C-Class", year=2020)
        car = CarService.create_car(car_data)

        assert car.id is not None

        # Create multiple schedules
        schedule1_data = ServiceScheduleCreate(
            car_id=car.id, next_service_date=date(2023, 12, 15), next_service_mileage=30000, service_type="Oil Change"
        )
        schedule2_data = ServiceScheduleCreate(
            car_id=car.id, next_service_date=date(2023, 8, 15), next_service_mileage=28000, service_type="Tire Rotation"
        )

        ServiceScheduleService.create_schedule(schedule1_data)
        ServiceScheduleService.create_schedule(schedule2_data)

        schedules = ServiceScheduleService.get_schedules_by_car(car.id)
        assert len(schedules) == 2

        # Should be ordered by next service date
        assert schedules[0].next_service_date == date(2023, 8, 15)
        assert schedules[1].next_service_date == date(2023, 12, 15)

    def test_update_schedule_existing(self, new_db):
        # Create a car and schedule
        car_data = CarCreate(make="Lexus", model="RX", year=2022)
        car = CarService.create_car(car_data)

        assert car.id is not None
        schedule_data = ServiceScheduleCreate(
            car_id=car.id, next_service_date=date(2023, 12, 15), next_service_mileage=30000, service_type="Oil Change"
        )
        schedule = ServiceScheduleService.create_schedule(schedule_data)

        assert schedule is not None and schedule.id is not None

        # Update the schedule
        update_data = ServiceScheduleUpdate(next_service_mileage=32000, notes="Extended interval")
        updated_schedule = ServiceScheduleService.update_schedule(schedule.id, update_data)

        assert updated_schedule is not None
        assert updated_schedule.next_service_mileage == 32000
        assert updated_schedule.notes == "Extended interval"
        assert updated_schedule.service_type == "Oil Change"  # Unchanged

    def test_get_upcoming_services(self, new_db):
        # Create multiple cars and schedules
        car1_data = CarCreate(make="Toyota", model="RAV4", year=2021)
        car2_data = CarCreate(make="Honda", model="CR-V", year=2020)

        car1 = CarService.create_car(car1_data)
        car2 = CarService.create_car(car2_data)

        assert car1.id is not None and car2.id is not None

        schedule1_data = ServiceScheduleCreate(
            car_id=car1.id, next_service_date=date(2023, 12, 15), next_service_mileage=30000, service_type="Oil Change"
        )
        schedule2_data = ServiceScheduleCreate(
            car_id=car2.id, next_service_date=date(2023, 8, 15), next_service_mileage=25000, service_type="Brake Check"
        )

        ServiceScheduleService.create_schedule(schedule1_data)
        ServiceScheduleService.create_schedule(schedule2_data)

        upcoming = ServiceScheduleService.get_upcoming_services()
        assert len(upcoming) == 2

        # Should be ordered by next service date
        assert upcoming[0].next_service_date == date(2023, 8, 15)
        assert upcoming[1].next_service_date == date(2023, 12, 15)
