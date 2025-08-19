from app.database import create_tables
import app.pomodoro_timer


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.pomodoro_timer.create()
