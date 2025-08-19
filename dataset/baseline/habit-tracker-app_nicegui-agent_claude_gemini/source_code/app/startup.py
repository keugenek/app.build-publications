from app.database import create_tables
import app.habit_tracker


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.habit_tracker.create()
