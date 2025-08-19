"""Smoke test for client-side storage application."""

import pytest


@pytest.mark.sqlmodel
@pytest.mark.skip(reason="This application uses client-side storage - no database models to test")
def test_sqlmodel_smoke():
    """Skipped - application uses client-side local storage instead of database."""
    pass


@pytest.mark.sqlmodel
@pytest.mark.skip(reason="This application uses client-side storage - no database models to test")
def test_databricks_models():
    """Skipped - application uses client-side local storage instead of database."""
    pass
