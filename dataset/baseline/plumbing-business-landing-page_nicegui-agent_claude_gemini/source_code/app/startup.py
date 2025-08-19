from app.database import create_tables
from app.services import initialize_sample_data
import app.landing_page


def startup() -> None:
    # this function is called before the first request
    create_tables()
    initialize_sample_data()  # Initialize sample services and testimonials
    app.landing_page.create()
