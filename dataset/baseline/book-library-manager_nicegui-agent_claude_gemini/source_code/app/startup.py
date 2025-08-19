from app.database import create_tables
import app.book_library


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.book_library.create()
