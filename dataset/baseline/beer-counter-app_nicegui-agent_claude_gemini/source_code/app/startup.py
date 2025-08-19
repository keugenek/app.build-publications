import app.beer_counter


def startup() -> None:
    # this function is called before the first request
    # No database setup needed - using client-side storage

    app.beer_counter.create()
