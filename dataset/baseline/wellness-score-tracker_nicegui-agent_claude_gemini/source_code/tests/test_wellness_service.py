import pytest
from datetime import date, timedelta
from decimal import Decimal

from app.database import reset_db
from app.models import User, WellnessEntryCreate, WellnessEntryUpdate
from app.wellness_service import WellnessService, UserService


@pytest.fixture
def clean_db():
    """Reset database before and after each test"""
    reset_db()
    yield
    reset_db()


@pytest.fixture
def sample_user(clean_db) -> User:
    """Create a sample user for testing"""
    user = UserService.create_user("John Doe", "john@example.com")
    assert user is not None
    return user


class TestWellnessService:
    """Test wellness service functionality"""

    def test_create_entry_success(self, sample_user):
        """Test creating a wellness entry successfully"""
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("8.0"),
            stress_level=3,
            caffeine_intake=Decimal("2.0"),
            alcohol_intake=Decimal("1.0"),
        )

        entry = WellnessService.create_entry(entry_data)

        assert entry is not None
        assert entry.user_id == sample_user.id
        assert entry.entry_date == date.today()
        assert entry.sleep_hours == Decimal("8.0")
        assert entry.stress_level == 3
        assert entry.caffeine_intake == Decimal("2.0")
        assert entry.alcohol_intake == Decimal("1.0")
        assert entry.wellness_score > Decimal("0")  # Score should be calculated

    def test_create_duplicate_entry_fails(self, sample_user):
        """Test that creating duplicate entry for same date fails"""
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("8.0"),
            stress_level=3,
            caffeine_intake=Decimal("2.0"),
            alcohol_intake=Decimal("1.0"),
        )

        # First entry should succeed
        first_entry = WellnessService.create_entry(entry_data)
        assert first_entry is not None

        # Second entry for same date should fail
        duplicate_entry = WellnessService.create_entry(entry_data)
        assert duplicate_entry is None

    def test_update_entry_success(self, sample_user):
        """Test updating a wellness entry successfully"""
        # Create initial entry
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("6.0"),
            stress_level=5,
            caffeine_intake=Decimal("1.0"),
            alcohol_intake=Decimal("0.0"),
        )
        entry = WellnessService.create_entry(entry_data)
        assert entry is not None
        original_score = entry.wellness_score

        # Update entry
        update_data = WellnessEntryUpdate(sleep_hours=Decimal("8.0"), stress_level=3)

        assert entry.id is not None
        updated_entry = WellnessService.update_entry(entry.id, update_data)

        assert updated_entry is not None
        assert updated_entry.id == entry.id
        assert updated_entry.sleep_hours == Decimal("8.0")
        assert updated_entry.stress_level == 3
        assert updated_entry.caffeine_intake == Decimal("1.0")  # Unchanged
        assert updated_entry.alcohol_intake == Decimal("0.0")  # Unchanged
        assert updated_entry.wellness_score != original_score  # Score should be recalculated

    def test_update_nonexistent_entry(self, sample_user):
        """Test updating non-existent entry returns None"""
        update_data = WellnessEntryUpdate(sleep_hours=Decimal("8.0"))
        result = WellnessService.update_entry(999, update_data)
        assert result is None

    def test_get_entry_by_date(self, sample_user):
        """Test retrieving entry by date"""
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("7.5"),
            stress_level=4,
            caffeine_intake=Decimal("2.5"),
            alcohol_intake=Decimal("1.0"),
        )
        created_entry = WellnessService.create_entry(entry_data)
        assert created_entry is not None

        # Retrieve by date
        retrieved_entry = WellnessService.get_entry_by_date(sample_user.id, date.today())

        assert retrieved_entry is not None
        assert retrieved_entry.id == created_entry.id
        assert retrieved_entry.sleep_hours == Decimal("7.5")

    def test_get_entry_by_date_not_found(self, sample_user):
        """Test retrieving entry by date when none exists"""
        yesterday = date.today() - timedelta(days=1)
        entry = WellnessService.get_entry_by_date(sample_user.id, yesterday)
        assert entry is None

    def test_get_user_entries(self, sample_user):
        """Test retrieving multiple user entries ordered by date"""
        # Create entries for different dates
        dates = [date.today() - timedelta(days=i) for i in range(5)]

        for i, entry_date in enumerate(dates):
            entry_data = WellnessEntryCreate(
                user_id=sample_user.id,
                entry_date=entry_date,
                sleep_hours=Decimal("7.0") + Decimal("0.1") * i,
                stress_level=3 + i,
                caffeine_intake=Decimal("2.0"),
                alcohol_intake=Decimal("0.0"),
            )
            WellnessService.create_entry(entry_data)

        entries = WellnessService.get_user_entries(sample_user.id)

        assert len(entries) == 5
        # Should be ordered by date descending (newest first)
        assert entries[0].entry_date == date.today()
        assert entries[-1].entry_date == date.today() - timedelta(days=4)

    def test_get_wellness_trends(self, sample_user):
        """Test retrieving wellness trend data"""
        # Create entries for past 7 days
        for i in range(7):
            entry_date = date.today() - timedelta(days=i)
            entry_data = WellnessEntryCreate(
                user_id=sample_user.id,
                entry_date=entry_date,
                sleep_hours=Decimal("7.0") + Decimal("0.1") * i,
                stress_level=3,
                caffeine_intake=Decimal("2.0"),
                alcohol_intake=Decimal("0.0"),
            )
            WellnessService.create_entry(entry_data)

        trends = WellnessService.get_wellness_trends(sample_user.id, days=7)

        assert len(trends) == 7
        # Should be ordered by date ascending (oldest first)
        assert trends[0].entry_date == date.today() - timedelta(days=6)
        assert trends[-1].entry_date == date.today()

    def test_calculate_average_score(self, sample_user):
        """Test calculating average wellness score"""
        # Create entries with known scores
        scores = []
        for i in range(3):
            entry_data = WellnessEntryCreate(
                user_id=sample_user.id,
                entry_date=date.today() - timedelta(days=i),
                sleep_hours=Decimal("8.0"),  # Good sleep
                stress_level=3,  # Low stress
                caffeine_intake=Decimal("2.0"),  # Optimal caffeine
                alcohol_intake=Decimal("0.0"),  # No alcohol
            )
            entry = WellnessService.create_entry(entry_data)
            assert entry is not None
            scores.append(entry.wellness_score)

        expected_avg = sum(scores) / Decimal("3")
        actual_avg = WellnessService.calculate_average_score(sample_user.id, days=3)

        assert actual_avg is not None
        assert actual_avg == expected_avg

    def test_calculate_average_score_no_entries(self, sample_user):
        """Test calculating average score with no entries"""
        avg_score = WellnessService.calculate_average_score(sample_user.id)
        assert avg_score is None

    def test_get_wellness_insights_with_data(self, sample_user):
        """Test getting wellness insights with existing data"""
        # Create entries with varying metrics
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("6.0"),  # Below optimal
            stress_level=8,  # High stress
            caffeine_intake=Decimal("5.0"),  # Too much caffeine
            alcohol_intake=Decimal("2.0"),  # Moderate alcohol
        )
        WellnessService.create_entry(entry_data)

        insights = WellnessService.get_wellness_insights(sample_user.id)

        assert insights["average_score"] is not None
        assert insights["average_sleep"] is not None
        assert insights["average_stress"] is not None
        assert len(insights["recommendations"]) > 0

        # Should contain sleep recommendation
        sleep_rec = any("sleep" in rec.lower() for rec in insights["recommendations"])
        assert sleep_rec

        # Should contain stress recommendation
        stress_rec = any("stress" in rec.lower() for rec in insights["recommendations"])
        assert stress_rec

    def test_get_wellness_insights_no_data(self, sample_user):
        """Test getting wellness insights with no data"""
        insights = WellnessService.get_wellness_insights(sample_user.id)

        assert insights["average_score"] is None
        assert insights["average_sleep"] is None
        assert insights["average_stress"] is None
        assert len(insights["recommendations"]) == 1
        assert "Start tracking" in insights["recommendations"][0]

    def test_delete_entry_success(self, sample_user):
        """Test deleting a wellness entry"""
        entry_data = WellnessEntryCreate(
            user_id=sample_user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("8.0"),
            stress_level=3,
            caffeine_intake=Decimal("2.0"),
            alcohol_intake=Decimal("1.0"),
        )
        entry = WellnessService.create_entry(entry_data)
        assert entry is not None

        # Delete entry
        assert entry.id is not None
        result = WellnessService.delete_entry(entry.id)
        assert result

        # Verify entry is deleted
        retrieved = WellnessService.get_entry_by_date(sample_user.id, date.today())
        assert retrieved is None

    def test_delete_nonexistent_entry(self):
        """Test deleting non-existent entry returns False"""
        result = WellnessService.delete_entry(999)
        assert not result


class TestUserService:
    """Test user service functionality"""

    def test_create_user_success(self, clean_db):
        """Test creating a user successfully"""
        user = UserService.create_user("Jane Doe", "jane@example.com")

        assert user is not None
        assert user.name == "Jane Doe"
        assert user.email == "jane@example.com"
        assert user.is_active

    def test_create_user_duplicate_email(self, clean_db):
        """Test creating user with duplicate email fails"""
        # First user should succeed
        first_user = UserService.create_user("John Doe", "john@example.com")
        assert first_user is not None

        # Second user with same email should fail
        duplicate_user = UserService.create_user("Jane Doe", "john@example.com")
        assert duplicate_user is None

    def test_get_user_by_email(self, clean_db):
        """Test retrieving user by email"""
        created_user = UserService.create_user("John Doe", "john@example.com")
        assert created_user is not None

        retrieved_user = UserService.get_user_by_email("john@example.com")

        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.name == "John Doe"

    def test_get_user_by_email_not_found(self, clean_db):
        """Test retrieving user by email when none exists"""
        user = UserService.get_user_by_email("nonexistent@example.com")
        assert user is None

    def test_get_user_by_id(self, clean_db):
        """Test retrieving user by ID"""
        created_user = UserService.create_user("John Doe", "john@example.com")
        assert created_user is not None

        assert created_user.id is not None
        retrieved_user = UserService.get_user_by_id(created_user.id)

        assert retrieved_user is not None
        assert retrieved_user.name == "John Doe"
        assert retrieved_user.email == "john@example.com"

    def test_get_user_by_id_not_found(self, clean_db):
        """Test retrieving user by ID when none exists"""
        user = UserService.get_user_by_id(999)
        assert user is None

    def test_get_all_users(self, clean_db):
        """Test retrieving all users"""
        # Create multiple users
        UserService.create_user("John Doe", "john@example.com")
        UserService.create_user("Jane Smith", "jane@example.com")

        users = UserService.get_all_users()

        assert len(users) == 2
        names = {user.name for user in users}
        assert "John Doe" in names
        assert "Jane Smith" in names


class TestWellnessScoreCalculation:
    """Test wellness score calculation logic"""

    def test_perfect_score(self, clean_db):
        """Test perfect wellness score calculation"""
        user = UserService.create_user("Test User", "test@example.com")
        assert user is not None

        assert user.id is not None
        entry_data = WellnessEntryCreate(
            user_id=user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("8.0"),  # Perfect sleep (30 points)
            stress_level=1,  # Minimal stress (25 points)
            caffeine_intake=Decimal("2.0"),  # Optimal caffeine (25 points)
            alcohol_intake=Decimal("0.0"),  # No alcohol (20 points)
        )

        entry = WellnessService.create_entry(entry_data)
        assert entry is not None
        assert entry.wellness_score == Decimal("100.0")  # Perfect score

    def test_minimum_score_components(self, clean_db):
        """Test wellness score with poor metrics"""
        user = UserService.create_user("Test User", "test@example.com")
        assert user is not None

        assert user.id is not None
        entry_data = WellnessEntryCreate(
            user_id=user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("2.0"),  # Very poor sleep (5 points)
            stress_level=10,  # Maximum stress (2.5 points)
            caffeine_intake=Decimal("10.0"),  # Excessive caffeine (5 points)
            alcohol_intake=Decimal("5.0"),  # Excessive alcohol (3 points)
        )

        entry = WellnessService.create_entry(entry_data)
        assert entry is not None
        assert entry.wellness_score == Decimal("15.5")  # Low score

    def test_moderate_score(self, clean_db):
        """Test wellness score with moderate metrics"""
        user = UserService.create_user("Test User", "test@example.com")
        assert user is not None

        assert user.id is not None
        entry_data = WellnessEntryCreate(
            user_id=user.id,
            entry_date=date.today(),
            sleep_hours=Decimal("6.5"),  # Slightly low sleep (25 points)
            stress_level=5,  # Moderate stress (15 points)
            caffeine_intake=Decimal("3.5"),  # Slightly high caffeine (20 points)
            alcohol_intake=Decimal("1.0"),  # Light drinking (15 points)
        )

        entry = WellnessService.create_entry(entry_data)
        assert entry is not None
        assert entry.wellness_score == Decimal("75.0")  # Moderate score
