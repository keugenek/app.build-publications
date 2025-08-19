from app.database import create_tables
import app.birthday_card


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.birthday_card.create()
