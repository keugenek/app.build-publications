from app.database import create_tables
import app.auth_ui
import app.dashboard_ui


def startup() -> None:
    # this function is called before the first request
    create_tables()

    # Register UI modules
    app.auth_ui.create()
    app.dashboard_ui.create()
