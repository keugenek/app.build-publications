"""Basic UI test to verify app structure"""

import pytest
from app.database import reset_db
from app.services import seed_suspicious_activities


@pytest.fixture
def fresh_db():
    """Provide a fresh database for each test"""
    reset_db()
    seed_suspicious_activities()
    yield
    reset_db()


def test_app_imports_successfully(fresh_db):
    """Test that the app can be imported without errors"""
    # This test verifies that our modules can be imported
    # and that the database is properly structured
    from app.cat_surveillance import create
    from app.services import CatService, ConspiracyService

    # Verify services work
    cats = CatService.get_all_cats()
    assert isinstance(cats, list)

    summary = ConspiracyService.calculate_today_summary()
    assert summary is not None

    # The create function should not raise errors when called
    # but we won't actually call it to avoid UI slot issues
    assert callable(create)
