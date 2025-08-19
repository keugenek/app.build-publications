from app.database import create_tables
import app.currency_converter


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.currency_converter.create()
