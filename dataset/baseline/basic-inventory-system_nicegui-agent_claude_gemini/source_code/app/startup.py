from app.database import create_tables
import app.dashboard
import app.product_management
import app.stock_transactions


def startup() -> None:
    # this function is called before the first request
    create_tables()

    # Register all modules
    app.dashboard.create()
    app.product_management.create()
    app.stock_transactions.create()
