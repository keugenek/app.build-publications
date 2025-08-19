from app.database import create_tables
import app.cat_surveillance


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.cat_surveillance.create()
