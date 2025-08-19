from app.database import create_tables
from app import weather_ui


def startup() -> None:
    # this function is called before the first request
    create_tables()
    weather_ui.create()
