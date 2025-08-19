from app.database import create_tables
import app.wellness_tracker


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.wellness_tracker.create()
