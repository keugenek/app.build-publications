from app.database import create_tables
import app.dashboard
import app.members
import app.chores
import app.history


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.dashboard.create()
    app.members.create()
    app.chores.create()
    app.history.create()
