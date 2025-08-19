from app.database import create_tables
import app.job_board


def startup() -> None:
    # this function is called before the first request
    create_tables()
    app.job_board.create()
