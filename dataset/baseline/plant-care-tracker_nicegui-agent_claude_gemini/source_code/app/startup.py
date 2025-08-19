from app.database import create_tables
import app.dashboard
import app.plant_management
import app.watering
import app.care_history


def startup() -> None:
    # this function is called before the first request
    create_tables()

    # Initialize all application modules
    app.dashboard.create()
    app.plant_management.create()
    app.watering.create()
    app.care_history.create()
