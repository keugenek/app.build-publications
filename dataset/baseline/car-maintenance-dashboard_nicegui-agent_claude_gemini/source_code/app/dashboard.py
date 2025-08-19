from nicegui import ui
from decimal import Decimal
from datetime import date
from app.car_service import CarService, MaintenanceService, ServiceScheduleService
from app.models import CarCreate, MaintenanceRecordCreate, ServiceScheduleCreate


def create():
    """Create the dashboard UI routes"""

    # Apply modern theme
    ui.colors(
        primary="#2563eb",
        secondary="#64748b",
        accent="#10b981",
        positive="#10b981",
        negative="#ef4444",
        warning="#f59e0b",
        info="#3b82f6",
    )

    @ui.page("/")
    def dashboard():
        """Main dashboard page"""
        with ui.column().classes("w-full max-w-6xl mx-auto p-6 gap-6"):
            # Header
            ui.label("🚗 Car Maintenance Dashboard").classes("text-3xl font-bold text-gray-800 mb-4")

            # Stats cards row
            with ui.row().classes("gap-4 w-full mb-6"):
                create_stats_cards()

            # Main content
            with ui.row().classes("gap-6 w-full"):
                # Left side - Car list and actions
                with ui.column().classes("flex-1"):
                    ui.label("Your Vehicles").classes("text-xl font-semibold text-gray-700 mb-4")

                    # Add new car button
                    ui.button("+ Add New Car", on_click=lambda: show_add_car_dialog()).classes(
                        "bg-primary text-white px-4 py-2 rounded mb-4"
                    )

                    # Car list container
                    create_car_list_container()

                # Right side - Upcoming services
                with ui.column().classes("w-80"):
                    ui.label("Upcoming Services").classes("text-xl font-semibold text-gray-700 mb-4")
                    create_upcoming_services_container()

    @ui.page("/car/{car_id}")
    def car_detail(car_id: int):
        """Car detail page showing maintenance history and schedules"""
        car = CarService.get_car_by_id(car_id)
        if car is None:
            ui.label("Car not found").classes("text-red-500 text-xl")
            return

        with ui.column().classes("w-full max-w-6xl mx-auto p-6 gap-6"):
            # Header with car info and back button
            with ui.row().classes("items-center gap-4 mb-6"):
                ui.button("← Back", on_click=lambda: ui.navigate.to("/")).classes(
                    "bg-gray-500 text-white px-4 py-2 rounded"
                )
                ui.label(f"{car.make} {car.model} ({car.year})").classes("text-2xl font-bold text-gray-800")

            with ui.row().classes("gap-6 w-full"):
                # Left side - Maintenance history
                with ui.column().classes("flex-1"):
                    with ui.row().classes("items-center gap-4 mb-4"):
                        ui.label("Maintenance History").classes("text-xl font-semibold text-gray-700")
                        ui.button("+ Add Record", on_click=lambda: show_add_maintenance_dialog(car_id)).classes(
                            "bg-primary text-white px-3 py-1 rounded text-sm"
                        )

                    create_maintenance_history_container(car_id)

                # Right side - Service schedules
                with ui.column().classes("w-80"):
                    with ui.row().classes("items-center gap-4 mb-4"):
                        ui.label("Service Schedules").classes("text-xl font-semibold text-gray-700")
                        ui.button("+ Add Schedule", on_click=lambda: show_add_schedule_dialog(car_id)).classes(
                            "bg-primary text-white px-3 py-1 rounded text-sm"
                        )

                    create_car_schedules_container(car_id)


@ui.refreshable
def create_stats_cards():
    """Create statistics cards for dashboard overview"""
    cars = CarService.get_all_cars()
    upcoming_services = ServiceScheduleService.get_upcoming_services()

    # Count overdue services (services with past dates)
    today = date.today()
    overdue_count = sum(1 for service in upcoming_services if service.next_service_date < today)

    def create_stat_card(title: str, value: str, subtitle: str = "", color: str = "blue"):
        with ui.card().classes("p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow min-w-48"):
            ui.label(title).classes("text-sm text-gray-500 uppercase tracking-wider")
            ui.label(value).classes(f"text-3xl font-bold text-{color}-600 mt-2")
            if subtitle:
                ui.label(subtitle).classes("text-sm text-gray-600 mt-1")

    create_stat_card("Total Cars", str(len(cars)), "registered vehicles")
    create_stat_card("Upcoming Services", str(len(upcoming_services)), "scheduled services", "green")
    create_stat_card("Overdue Services", str(overdue_count), "need attention", "red" if overdue_count > 0 else "gray")


@ui.refreshable
def create_car_list_container():
    """Create refreshable container for car list"""
    cars = CarService.get_all_cars()

    if not cars:
        with ui.card().classes("p-6 text-center bg-gray-50"):
            ui.label("No cars registered yet").classes("text-gray-500")
            ui.label('Click "Add New Car" to get started').classes("text-sm text-gray-400 mt-2")
        return

    for car in cars:

        def navigate_to_car(car_obj=car):
            if car_obj.id is not None:
                ui.navigate.to(f"/car/{car_obj.id}")

        with (
            ui.card()
            .classes("p-4 bg-white shadow hover:shadow-md transition-shadow cursor-pointer")
            .on("click", navigate_to_car)
        ):
            with ui.row().classes("items-center justify-between w-full"):
                with ui.column():
                    ui.label(f"{car.make} {car.model}").classes("font-semibold text-lg")
                    ui.label(f"Year: {car.year}").classes("text-gray-600")

                # Show latest mileage if available
                if car.id is not None:
                    latest_mileage = MaintenanceService.get_latest_mileage(car.id)
                    if latest_mileage:
                        ui.label(f"{latest_mileage:,} miles").classes("text-sm text-gray-500")


@ui.refreshable
def create_upcoming_services_container():
    """Create refreshable container for upcoming services"""
    upcoming = ServiceScheduleService.get_upcoming_services()
    today = date.today()

    if not upcoming:
        with ui.card().classes("p-4 text-center bg-gray-50"):
            ui.label("No upcoming services").classes("text-gray-500")
        return

    for service in upcoming[:10]:  # Show top 10
        car = CarService.get_car_by_id(service.car_id)
        if car is None:
            continue

        is_overdue = service.next_service_date < today
        card_color = "border-l-4 border-red-500 bg-red-50" if is_overdue else "border-l-4 border-blue-500"

        def navigate_to_car_detail(car_obj=car):
            if car_obj.id is not None:
                ui.navigate.to(f"/car/{car_obj.id}")

        with ui.card().classes(f"p-3 {card_color} cursor-pointer").on("click", navigate_to_car_detail):
            ui.label(f"{car.make} {car.model}").classes("font-medium text-sm")
            ui.label(service.service_type).classes("text-xs text-gray-600")

            date_color = "text-red-600" if is_overdue else "text-gray-700"
            ui.label(service.next_service_date.strftime("%b %d, %Y")).classes(f"text-xs {date_color}")

            if is_overdue:
                ui.label("OVERDUE").classes("text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded mt-1")


@ui.refreshable
def create_maintenance_history_container(car_id: int):
    """Create refreshable container for maintenance history"""
    records = MaintenanceService.get_records_by_car(car_id)

    if not records:
        with ui.card().classes("p-6 text-center bg-gray-50"):
            ui.label("No maintenance records yet").classes("text-gray-500")
            ui.label('Click "Add Record" to start tracking maintenance').classes("text-sm text-gray-400 mt-2")
        return

    for record in records:
        with ui.card().classes("p-4 bg-white shadow hover:shadow-md transition-shadow"):
            with ui.row().classes("items-start justify-between w-full"):
                with ui.column().classes("flex-1"):
                    ui.label(record.service_type).classes("font-semibold text-lg")
                    ui.label(f"Date: {record.service_date.strftime('%b %d, %Y')}").classes("text-gray-600 text-sm")
                    ui.label(f"Mileage: {record.mileage:,} miles").classes("text-gray-600 text-sm")
                    if record.notes:
                        ui.label(f"Notes: {record.notes}").classes("text-gray-500 text-sm mt-1")

                with ui.column().classes("text-right"):
                    ui.label(f"${record.cost}").classes("font-bold text-green-600 text-lg")
                    if record.id is not None:

                        def delete_handler(record_id=record.id):
                            if record_id is not None:
                                delete_maintenance_record(record_id)

                        ui.button("Delete", on_click=delete_handler).classes(
                            "bg-red-500 text-white px-2 py-1 rounded text-xs mt-2"
                        )


@ui.refreshable
def create_car_schedules_container(car_id: int):
    """Create refreshable container for car service schedules"""
    schedules = ServiceScheduleService.get_schedules_by_car(car_id)
    today = date.today()

    if not schedules:
        with ui.card().classes("p-4 text-center bg-gray-50"):
            ui.label("No service schedules").classes("text-gray-500")
            ui.label('Click "Add Schedule" to plan ahead').classes("text-sm text-gray-400 mt-2")
        return

    for schedule in schedules:
        is_overdue = schedule.next_service_date < today
        card_color = "border-l-4 border-red-500 bg-red-50" if is_overdue else "border-l-4 border-green-500"

        with ui.card().classes(f"p-3 {card_color}"):
            ui.label(schedule.service_type).classes("font-semibold")
            ui.label(f"Due: {schedule.next_service_date.strftime('%b %d, %Y')}").classes("text-sm text-gray-600")
            ui.label(f"At: {schedule.next_service_mileage:,} miles").classes("text-sm text-gray-600")

            if is_overdue:
                ui.label("OVERDUE").classes("text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded mt-1")

            if schedule.notes:
                ui.label(schedule.notes).classes("text-xs text-gray-500 mt-1")

            if schedule.id is not None:

                def delete_schedule_handler(schedule_id=schedule.id):
                    if schedule_id is not None:
                        delete_service_schedule(schedule_id)

                ui.button("Delete", on_click=delete_schedule_handler).classes(
                    "bg-red-500 text-white px-2 py-1 rounded text-xs mt-2"
                )


def show_add_car_dialog():
    """Show dialog to add a new car"""
    with ui.dialog() as dialog, ui.card().classes("w-96"):
        ui.label("Add New Car").classes("text-xl font-bold mb-4")

        make_input = ui.input("Make").classes("w-full mb-2")
        model_input = ui.input("Model").classes("w-full mb-2")
        year_input = ui.number(value=2024, precision=0).classes("w-full mb-4")
        year_input.props('label="Year"')

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
            ui.button(
                "Add Car",
                on_click=lambda: add_car_and_close(
                    dialog, make_input.value or "", model_input.value or "", int(year_input.value or 2024)
                ),
            ).classes("bg-primary text-white")

    dialog.open()


def add_car_and_close(dialog, make: str, model: str, year: int):
    """Add car and close dialog"""
    if not make or not model:
        ui.notify("Please fill in all fields", type="negative")
        return

    try:
        car_data = CarCreate(make=make, model=model, year=year)
        CarService.create_car(car_data)
        dialog.close()
        ui.notify(f"Added {make} {model} ({year})", type="positive")
        create_car_list_container.refresh()
        create_stats_cards.refresh()
    except Exception as e:
        ui.notify(f"Error adding car: {str(e)}", type="negative")


def show_add_maintenance_dialog(car_id: int):
    """Show dialog to add maintenance record"""
    with ui.dialog() as dialog, ui.card().classes("w-96"):
        ui.label("Add Maintenance Record").classes("text-xl font-bold mb-4")

        ui.label("Service Date").classes("text-sm font-medium text-gray-700 mb-1")
        service_date_input = ui.date().classes("w-full mb-2")
        service_date_input.value = date.today().isoformat()
        service_type_input = ui.input("Service Type", placeholder="e.g., Oil Change").classes("w-full mb-2")
        cost_input = ui.number(precision=2, step=0.01).classes("w-full mb-2")
        cost_input.props('label="Cost ($)"')
        mileage_input = ui.number(precision=0).classes("w-full mb-2")
        mileage_input.props('label="Mileage"')
        notes_input = ui.textarea("Notes (optional)").classes("w-full mb-4").props("rows=2")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
            ui.button(
                "Add Record",
                on_click=lambda: add_maintenance_and_close(
                    dialog, car_id, service_date_input, service_type_input, cost_input, mileage_input, notes_input
                ),
            ).classes("bg-primary text-white")

    dialog.open()


def add_maintenance_and_close(dialog, car_id: int, date_input, type_input, cost_input, mileage_input, notes_input):
    """Add maintenance record and close dialog"""
    service_date_val = date_input.value
    service_type_val = type_input.value or ""
    cost_val = cost_input.value
    mileage_val = mileage_input.value
    notes_val = notes_input.value or ""

    if not service_date_val or not service_type_val or cost_val is None or mileage_val is None:
        ui.notify("Please fill in all required fields", type="negative")
        return

    try:
        record_data = MaintenanceRecordCreate(
            car_id=car_id,
            service_date=service_date_val,
            service_type=service_type_val,
            cost=Decimal(str(cost_val)),
            mileage=int(mileage_val),
            notes=notes_val,
        )
        MaintenanceService.create_record(record_data)
        dialog.close()
        ui.notify(f"Added {service_type_val} record", type="positive")
        create_maintenance_history_container.refresh()
        create_car_list_container.refresh()
        create_stats_cards.refresh()
    except Exception as e:
        ui.notify(f"Error adding record: {str(e)}", type="negative")


def show_add_schedule_dialog(car_id: int):
    """Show dialog to add service schedule"""
    with ui.dialog() as dialog, ui.card().classes("w-96"):
        ui.label("Add Service Schedule").classes("text-xl font-bold mb-4")

        ui.label("Next Service Date").classes("text-sm font-medium text-gray-700 mb-1")
        service_date_input = ui.date().classes("w-full mb-2")
        service_type_input = ui.input("Service Type", placeholder="e.g., Oil Change").classes("w-full mb-2")
        mileage_input = ui.number(precision=0).classes("w-full mb-2")
        mileage_input.props('label="Next Service Mileage"')
        notes_input = ui.textarea("Notes (optional)").classes("w-full mb-4").props("rows=2")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
            ui.button(
                "Add Schedule",
                on_click=lambda: add_schedule_and_close(
                    dialog, car_id, service_date_input, service_type_input, mileage_input, notes_input
                ),
            ).classes("bg-primary text-white")

    dialog.open()


def add_schedule_and_close(dialog, car_id: int, date_input, type_input, mileage_input, notes_input):
    """Add service schedule and close dialog"""
    service_date_val = date_input.value
    service_type_val = type_input.value or ""
    mileage_val = mileage_input.value
    notes_val = notes_input.value or ""

    if not service_date_val or not service_type_val or mileage_val is None:
        ui.notify("Please fill in all required fields", type="negative")
        return

    try:
        schedule_data = ServiceScheduleCreate(
            car_id=car_id,
            next_service_date=service_date_val,
            next_service_mileage=int(mileage_val),
            service_type=service_type_val,
            notes=notes_val,
        )
        ServiceScheduleService.create_schedule(schedule_data)
        dialog.close()
        ui.notify(f"Added {service_type_val} schedule", type="positive")
        create_car_schedules_container.refresh()
        create_upcoming_services_container.refresh()
        create_stats_cards.refresh()
    except Exception as e:
        ui.notify(f"Error adding schedule: {str(e)}", type="negative")


def delete_maintenance_record(record_id: int):
    """Delete a maintenance record with confirmation"""
    with ui.dialog() as dialog, ui.card():
        ui.label("Delete Maintenance Record?").classes("text-lg font-bold mb-4")
        ui.label("This action cannot be undone.").classes("text-gray-600 mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
            ui.button("Delete", on_click=lambda: perform_delete_record(dialog, record_id)).classes(
                "bg-red-500 text-white"
            )

    dialog.open()


def perform_delete_record(dialog, record_id: int):
    """Actually delete the maintenance record"""
    try:
        success = MaintenanceService.delete_record(record_id)
        if success:
            dialog.close()
            ui.notify("Maintenance record deleted", type="warning")
            create_maintenance_history_container.refresh()
            create_car_list_container.refresh()
            create_stats_cards.refresh()
        else:
            ui.notify("Failed to delete record", type="negative")
    except Exception as e:
        ui.notify(f"Error deleting record: {str(e)}", type="negative")


def delete_service_schedule(schedule_id: int):
    """Delete a service schedule with confirmation"""
    with ui.dialog() as dialog, ui.card():
        ui.label("Delete Service Schedule?").classes("text-lg font-bold mb-4")
        ui.label("This action cannot be undone.").classes("text-gray-600 mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
            ui.button("Delete", on_click=lambda: perform_delete_schedule(dialog, schedule_id)).classes(
                "bg-red-500 text-white"
            )

    dialog.open()


def perform_delete_schedule(dialog, schedule_id: int):
    """Actually delete the service schedule"""
    try:
        success = ServiceScheduleService.delete_schedule(schedule_id)
        if success:
            dialog.close()
            ui.notify("Service schedule deleted", type="warning")
            create_car_schedules_container.refresh()
            create_upcoming_services_container.refresh()
            create_stats_cards.refresh()
        else:
            ui.notify("Failed to delete schedule", type="negative")
    except Exception as e:
        ui.notify(f"Error deleting schedule: {str(e)}", type="negative")
