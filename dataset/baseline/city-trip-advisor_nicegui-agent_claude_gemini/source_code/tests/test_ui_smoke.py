"""Smoke tests for UI functionality."""

from app.startup import startup


def test_startup_function_runs():
    """Test that startup function can be called without errors."""
    # This will create the database tables and register UI routes
    startup()

    # If we get here, startup completed successfully
    assert True


def test_ui_modules_can_be_imported():
    """Test that all UI modules can be imported."""
    from app import weather_ui

    # Check that the module has the expected create function
    assert hasattr(weather_ui, "create")
    assert callable(weather_ui.create)
