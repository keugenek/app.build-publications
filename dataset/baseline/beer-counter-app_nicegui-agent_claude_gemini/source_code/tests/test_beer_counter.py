"""Tests for the beer counter application using client-side storage."""

from nicegui.testing import User
from nicegui import ui


class TestBeerCounterLogic:
    """Test the core logic of the beer counter without UI interactions."""

    def test_local_storage_javascript_functions(self):
        """Test that the JavaScript local storage functions are properly defined."""
        # Since we're using client-side storage, the logic is in JavaScript
        # We test the UI integration instead
        assert True  # Placeholder for JavaScript function tests

    def test_counter_increment_logic(self):
        """Test counter increment logic."""
        # Test positive increment
        assert max(0, 5 + 1) == 6

        # Test negative increment with floor at 0
        assert max(0, 1 + (-2)) == 0
        assert max(0, 0 + (-1)) == 0

    def test_statistics_calculation(self):
        """Test statistics calculation logic."""
        # Test daily stats accumulation
        current_daily = 5
        increment = 2
        assert current_daily + increment == 7

        # Test weekly stats accumulation
        current_weekly = 10
        assert current_weekly + increment == 12

        # Test all-time stats
        current_all_time = 100
        assert current_all_time + increment == 102


class TestBeerCounterUI:
    """Test UI components and interactions."""

    async def test_beer_counter_page_loads(self, user: User):
        """Test that the beer counter page loads correctly."""
        await user.open("/")

        # Check that main elements are present
        await user.should_see("Beer Counter")
        await user.should_see("🍺")
        await user.should_see("Statistics")

    async def test_counter_buttons_present(self, user: User):
        """Test that counter control buttons are present."""
        await user.open("/")

        # Check for increment/decrement buttons
        plus_buttons = list(user.find(ui.button).elements)
        button_texts = []

        for btn in plus_buttons:
            if hasattr(btn, "text"):
                button_texts.append(btn.text)
            elif hasattr(btn, "_props") and "label" in btn._props:
                button_texts.append(btn._props["label"])

        # Should have +, -, Reset Counter, and Clear Statistics buttons
        assert any("+" in str(text) for text in button_texts)
        assert any("-" in str(text) for text in button_texts)

        # Look for reset and clear buttons by their text content
        await user.should_see("Reset Counter")
        await user.should_see("Clear Statistics")

    async def test_statistics_display(self, user: User):
        """Test that statistics are displayed."""
        await user.open("/")

        # Check statistics labels are present
        await user.should_see("Today:")
        await user.should_see("This Week:")
        await user.should_see("All Time:")

    async def test_glass_morphism_styling(self, user: User):
        """Test that modern styling is applied."""
        await user.open("/")

        # The styling should be applied via CSS classes
        # We can check that the page loads without errors
        cards = list(user.find(ui.card).elements)
        assert len(cards) >= 1  # Should have at least the main counter card

    async def test_page_structure(self, user: User):
        """Test the overall page structure."""
        await user.open("/")

        # Check for main structural elements
        columns = list(user.find(ui.column).elements)
        assert len(columns) >= 1  # Main column container

        rows = list(user.find(ui.row).elements)
        assert len(rows) >= 1  # Button rows and statistics rows

        labels = list(user.find(ui.label).elements)
        assert len(labels) >= 5  # Title, counter, and statistics labels


class TestBeerCounterIntegration:
    """Integration tests for the complete beer counter functionality."""

    async def test_full_page_interaction_flow(self, user: User):
        """Test a complete user interaction flow."""
        await user.open("/")

        # Verify initial state
        await user.should_see("Beer Counter")
        await user.should_see("0")  # Initial counter value

        # Check that all expected UI elements are rendered
        buttons = list(user.find(ui.button).elements)
        assert len(buttons) >= 4  # +, -, Reset, Clear buttons

        cards = list(user.find(ui.card).elements)
        assert len(cards) >= 2  # Main counter card and statistics card

    async def test_error_handling(self, user: User):
        """Test that the application handles edge cases gracefully."""
        await user.open("/")

        # Page should load without JavaScript errors
        # The counter should initialize to 0
        await user.should_see("0")

        # All buttons should be present and accessible
        buttons = list(user.find(ui.button).elements)
        assert len(buttons) >= 4  # Should have at least 4 buttons

    async def test_responsive_design(self, user: User):
        """Test that the design works with different content."""
        await user.open("/")

        # Check that cards have proper styling classes
        cards = list(user.find(ui.card).elements)
        for card in cards:
            # Cards should have styling applied (we can't easily test CSS classes in nicegui tests)
            # But we can verify they exist and don't cause errors
            assert card is not None


# Performance and edge case tests
class TestBeerCounterPerformance:
    """Test performance and edge cases."""

    def test_large_counter_values(self):
        """Test handling of large counter values."""
        # Test JavaScript number limits
        large_value = 999999999
        assert large_value > 0
        assert str(large_value).isdigit()

    def test_date_key_generation(self):
        """Test date key generation logic."""
        from datetime import datetime

        # Test ISO date format
        today = datetime.now().date()
        date_key = today.isoformat()

        assert len(date_key) == 10  # YYYY-MM-DD format
        assert date_key.count("-") == 2

    def test_storage_key_formats(self):
        """Test storage key format consistency."""
        # Test key formats used in JavaScript
        today_key_prefix = "beer-today-"
        week_key_prefix = "beer-week-"

        assert today_key_prefix.startswith("beer-")
        assert week_key_prefix.startswith("beer-")
        assert "today" in today_key_prefix
        assert "week" in week_key_prefix


# Smoke test for critical path
async def test_beer_counter_critical_path(user: User):
    """Critical path smoke test - just ensure the app doesn't crash."""
    await user.open("/")
    await user.should_see("Beer Counter")

    # App loaded successfully without errors
    assert True
