"""Tests for cat surveillance services"""

import pytest
from datetime import date
from decimal import Decimal

from app.database import reset_db
from app.services import (
    CatService,
    SuspiciousActivityService,
    ActivityLogService,
    ConspiracyService,
    seed_suspicious_activities,
)
from app.models import CatCreate, SuspiciousActivityCreate, ActivityLogCreate


@pytest.fixture
def fresh_db():
    """Provide a fresh database for each test"""
    reset_db()
    yield
    reset_db()


@pytest.fixture
def sample_cat(fresh_db):
    """Create a sample cat for testing"""
    cat_data = CatCreate(
        name="Whiskers",
        breed="Persian",
        color="Gray",
        age_months=24,
        description="Known troublemaker with suspicious eyes",
    )
    return CatService.create_cat(cat_data)


@pytest.fixture
def sample_activity(fresh_db):
    """Create a sample suspicious activity"""
    activity_data = SuspiciousActivityCreate(
        name="Test Staring", description="Making suspicious eye contact", conspiracy_points=Decimal("3.0"), icon="👁️"
    )
    return SuspiciousActivityService.create_activity(activity_data)


class TestCatService:
    """Test cat management operations"""

    def test_create_cat(self, fresh_db):
        """Test creating a new cat"""
        cat_data = CatCreate(name="Fluffy", breed="Maine Coon", color="Orange", age_months=18)

        cat = CatService.create_cat(cat_data)

        assert cat.id is not None
        assert cat.name == "Fluffy"
        assert cat.breed == "Maine Coon"
        assert cat.color == "Orange"
        assert cat.age_months == 18
        assert cat.created_at is not None

    def test_create_cat_minimal_data(self, fresh_db):
        """Test creating a cat with only required fields"""
        cat_data = CatCreate(name="Minimal")
        cat = CatService.create_cat(cat_data)

        assert cat.id is not None
        assert cat.name == "Minimal"
        assert cat.breed is None
        assert cat.color is None
        assert cat.age_months is None
        assert cat.description is None

    def test_get_cat(self, sample_cat):
        """Test retrieving a cat by ID"""
        retrieved = CatService.get_cat(sample_cat.id)

        assert retrieved is not None
        assert retrieved.id == sample_cat.id
        assert retrieved.name == sample_cat.name
        assert retrieved.breed == sample_cat.breed

    def test_get_cat_not_found(self, fresh_db):
        """Test retrieving non-existent cat"""
        result = CatService.get_cat(999)
        assert result is None

    def test_get_all_cats(self, fresh_db):
        """Test getting all cats"""
        # Start with no cats
        cats = CatService.get_all_cats()
        assert len(cats) == 0

        # Add some cats
        CatService.create_cat(CatCreate(name="Alpha"))
        CatService.create_cat(CatCreate(name="Beta"))

        cats = CatService.get_all_cats()
        assert len(cats) == 2
        # Should be sorted by name
        assert cats[0].name == "Alpha"
        assert cats[1].name == "Beta"

    def test_update_cat(self, sample_cat):
        """Test updating cat information"""
        from app.models import CatUpdate

        update_data = CatUpdate(name="New Name", breed="New Breed", age_months=36)

        updated = CatService.update_cat(sample_cat.id, update_data)

        assert updated is not None
        assert updated.name == "New Name"
        assert updated.breed == "New Breed"
        assert updated.age_months == 36
        assert updated.color == sample_cat.color  # Unchanged

    def test_update_cat_not_found(self, fresh_db):
        """Test updating non-existent cat"""
        from app.models import CatUpdate

        result = CatService.update_cat(999, CatUpdate(name="Nope"))
        assert result is None

    def test_delete_cat(self, sample_cat):
        """Test deleting a cat"""
        assert CatService.delete_cat(sample_cat.id)

        # Verify it's gone
        assert CatService.get_cat(sample_cat.id) is None

    def test_delete_cat_not_found(self, fresh_db):
        """Test deleting non-existent cat"""
        assert not CatService.delete_cat(999)


class TestSuspiciousActivityService:
    """Test suspicious activity management"""

    def test_create_activity(self, fresh_db):
        """Test creating a suspicious activity"""
        activity_data = SuspiciousActivityCreate(
            name="Keyboard Sitting",
            description="Strategically positioned on important work equipment",
            conspiracy_points=Decimal("2.5"),
            icon="⌨️",
        )

        activity = SuspiciousActivityService.create_activity(activity_data)

        assert activity.id is not None
        assert activity.name == "Keyboard Sitting"
        assert activity.description == "Strategically positioned on important work equipment"
        assert activity.conspiracy_points == Decimal("2.5")
        assert activity.icon == "⌨️"
        assert activity.created_at is not None

    def test_get_activity(self, sample_activity):
        """Test retrieving an activity by ID"""
        retrieved = SuspiciousActivityService.get_activity(sample_activity.id)

        assert retrieved is not None
        assert retrieved.id == sample_activity.id
        assert retrieved.name == sample_activity.name

    def test_get_activity_not_found(self, fresh_db):
        """Test retrieving non-existent activity"""
        result = SuspiciousActivityService.get_activity(999)
        assert result is None

    def test_get_all_activities(self, fresh_db):
        """Test getting all activities"""
        activities = SuspiciousActivityService.get_all_activities()
        assert len(activities) == 0

        # Create some activities
        SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Alpha Activity", description="Test", conspiracy_points=Decimal("1"))
        )
        SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Beta Activity", description="Test", conspiracy_points=Decimal("2"))
        )

        activities = SuspiciousActivityService.get_all_activities()
        assert len(activities) == 2
        # Should be sorted by name
        assert activities[0].name == "Alpha Activity"
        assert activities[1].name == "Beta Activity"

    def test_get_activities_by_points(self, fresh_db):
        """Test getting activities sorted by conspiracy points"""
        # Create activities with different point values
        SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Low", description="Test", conspiracy_points=Decimal("1"))
        )
        SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="High", description="Test", conspiracy_points=Decimal("5"))
        )
        SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Medium", description="Test", conspiracy_points=Decimal("3"))
        )

        activities = SuspiciousActivityService.get_activities_by_points()
        assert len(activities) == 3
        # Should be sorted by points, highest first
        assert activities[0].name == "High"
        assert activities[1].name == "Medium"
        assert activities[2].name == "Low"


class TestActivityLogService:
    """Test activity logging operations"""

    def test_log_activity(self, sample_cat, sample_activity):
        """Test logging a suspicious activity"""
        log_data = ActivityLogCreate(
            cat_id=sample_cat.id, activity_id=sample_activity.id, intensity=4, notes="Very suspicious indeed"
        )

        log = ActivityLogService.log_activity(log_data)

        assert log.id is not None
        assert log.cat_id == sample_cat.id
        assert log.activity_id == sample_activity.id
        assert log.intensity == 4
        assert log.notes == "Very suspicious indeed"
        assert log.logged_at is not None
        assert log.logged_date == date.today()

    def test_log_activity_minimal(self, sample_cat, sample_activity):
        """Test logging with minimal data"""
        log_data = ActivityLogCreate(cat_id=sample_cat.id, activity_id=sample_activity.id)

        log = ActivityLogService.log_activity(log_data)

        assert log.intensity == 1  # Default value
        assert log.notes is None

    def test_get_logs_for_cat_today(self, sample_cat, sample_activity):
        """Test getting today's logs for a specific cat"""
        # Create some logs for today
        for i in range(3):
            ActivityLogService.log_activity(
                ActivityLogCreate(cat_id=sample_cat.id, activity_id=sample_activity.id, intensity=i + 1)
            )

        logs = ActivityLogService.get_logs_for_cat_today(sample_cat.id)
        assert len(logs) == 3

        # Should be ordered by logged_at desc (most recent first)
        intensities = [log.intensity for log in logs]
        assert intensities == [3, 2, 1]  # Most recent (3) first

    def test_get_logs_for_cat_today_empty(self, sample_cat):
        """Test getting logs when none exist"""
        logs = ActivityLogService.get_logs_for_cat_today(sample_cat.id)
        assert len(logs) == 0

    def test_get_logs_for_date(self, sample_cat, sample_activity):
        """Test getting all logs for a specific date"""
        target_date = date.today()

        # Create logs
        ActivityLogService.log_activity(ActivityLogCreate(cat_id=sample_cat.id, activity_id=sample_activity.id))
        ActivityLogService.log_activity(ActivityLogCreate(cat_id=sample_cat.id, activity_id=sample_activity.id))

        logs = ActivityLogService.get_logs_for_date(target_date)
        assert len(logs) == 2

    def test_delete_log(self, sample_cat, sample_activity):
        """Test deleting an activity log"""
        log = ActivityLogService.log_activity(ActivityLogCreate(cat_id=sample_cat.id, activity_id=sample_activity.id))

        if log.id is not None:
            assert ActivityLogService.delete_log(log.id)

        # Verify it's gone
        logs = ActivityLogService.get_logs_for_cat_today(sample_cat.id)
        assert len(logs) == 0

    def test_delete_log_not_found(self, fresh_db):
        """Test deleting non-existent log"""
        assert not ActivityLogService.delete_log(999)


class TestConspiracyService:
    """Test conspiracy level calculations"""

    def test_calculate_daily_conspiracy_level_no_activities(self, sample_cat):
        """Test conspiracy level with no activities"""
        level = ConspiracyService.calculate_daily_conspiracy_level(sample_cat.id, date.today())

        assert level is not None
        assert level.cat_id == sample_cat.id
        assert level.cat_name == sample_cat.name
        assert level.date == date.today()
        assert level.total_points == Decimal("0")
        assert level.activity_count == 0
        assert level.conspiracy_level == "Suspiciously Quiet"
        assert "too well-behaved" in level.level_description

    def test_calculate_daily_conspiracy_level_with_activities(self, sample_cat, sample_activity):
        """Test conspiracy level calculation with activities"""
        # Log some activities
        ActivityLogService.log_activity(
            ActivityLogCreate(
                cat_id=sample_cat.id,
                activity_id=sample_activity.id,
                intensity=2,  # 3.0 points * 2 intensity = 6.0 total
            )
        )
        ActivityLogService.log_activity(
            ActivityLogCreate(
                cat_id=sample_cat.id,
                activity_id=sample_activity.id,
                intensity=1,  # 3.0 points * 1 intensity = 3.0 total
            )
        )

        level = ConspiracyService.calculate_daily_conspiracy_level(sample_cat.id, date.today())

        assert level is not None
        assert level.total_points == Decimal("9.0")  # 6.0 + 3.0
        assert level.activity_count == 2
        assert "Minor Scheming" in level.conspiracy_level

    def test_calculate_daily_conspiracy_level_cat_not_found(self, fresh_db):
        """Test conspiracy level for non-existent cat"""
        result = ConspiracyService.calculate_daily_conspiracy_level(999, date.today())
        assert result is None

    def test_calculate_today_summary_no_cats(self, fresh_db):
        """Test today's summary with no cats"""
        summary = ConspiracyService.calculate_today_summary()

        assert summary.date == date.today()
        assert len(summary.cats) == 0
        assert summary.total_activities == 0
        assert summary.most_suspicious_cat is None
        assert "Suspiciously Quiet" in summary.overall_threat_level

    def test_calculate_today_summary_with_cats(self, fresh_db):
        """Test today's summary with multiple cats and activities"""
        # Create cats and activities
        cat1 = CatService.create_cat(CatCreate(name="Cat1"))
        cat2 = CatService.create_cat(CatCreate(name="Cat2"))
        activity = SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Test", description="Test", conspiracy_points=Decimal("5"))
        )

        # Log activities - Cat2 should be more suspicious
        if cat1.id is not None and cat2.id is not None and activity.id is not None:
            ActivityLogService.log_activity(
                ActivityLogCreate(
                    cat_id=cat1.id,
                    activity_id=activity.id,
                    intensity=2,  # 10 points
                )
            )
            ActivityLogService.log_activity(
                ActivityLogCreate(
                    cat_id=cat2.id,
                    activity_id=activity.id,
                    intensity=3,  # 15 points
                )
            )
            ActivityLogService.log_activity(
                ActivityLogCreate(
                    cat_id=cat2.id,
                    activity_id=activity.id,
                    intensity=1,  # 5 points
                )
            )

        summary = ConspiracyService.calculate_today_summary()

        assert len(summary.cats) == 2
        assert summary.total_activities == 3
        assert summary.most_suspicious_cat == "Cat2"  # 20 points vs 10
        # With 20 points max, should be "High Alert" (>= 20 points)
        assert "High Alert" in summary.overall_threat_level

    def test_conspiracy_level_interpretation(self, fresh_db):
        """Test different conspiracy level interpretations"""
        cat = CatService.create_cat(CatCreate(name="Test Cat"))

        # Test different point levels by creating activities with specific points
        # Note: conspiracy_points max is 10.0, so we use intensity to get higher totals
        test_cases = [
            (Decimal("6.0"), 5, "MAXIMUM ALERT"),  # 6*5 = 30 points
            (Decimal("4.0"), 5, "Highly Suspicious"),  # 4*5 = 20 points
            (Decimal("3.0"), 5, "Major Plotting"),  # 3*5 = 15 points
            (Decimal("2.5"), 5, "Moderate Conspiracy"),  # 2.5*5 = 12.5 points
            (Decimal("1.5"), 5, "Minor Scheming"),  # 1.5*5 = 7.5 points
            (Decimal("1.0"), 2, "Baseline Suspicion"),  # 1*2 = 2 points
        ]

        for points, intensity, expected_level in test_cases:
            # Reset database and recreate cat
            reset_db()
            cat = CatService.create_cat(CatCreate(name="Test Cat"))

            # Create activity with exact points needed
            activity = SuspiciousActivityService.create_activity(
                SuspiciousActivityCreate(
                    name=f"Test Activity {points}",
                    description="Test activity for conspiracy level testing",
                    conspiracy_points=points,
                )
            )

            # Log with specified intensity to get target points
            if cat.id is not None and activity.id is not None:
                ActivityLogService.log_activity(
                    ActivityLogCreate(cat_id=cat.id, activity_id=activity.id, intensity=intensity)
                )

                level = ConspiracyService.calculate_daily_conspiracy_level(cat.id, date.today())
                assert level is not None
                assert expected_level in level.conspiracy_level


class TestSeedData:
    """Test seeding of suspicious activities"""

    def test_seed_suspicious_activities(self, fresh_db):
        """Test that seed data is created correctly"""
        seed_suspicious_activities()

        activities = SuspiciousActivityService.get_all_activities()

        # Should have the predefined activities
        assert len(activities) > 0

        # Check some specific activities
        activity_names = [act.name for act in activities]
        assert "Prolonged Staring" in activity_names
        assert "Knocking Items Off Shelves" in activity_names
        assert "Mysterious House Sprinting" in activity_names

        # Verify they have proper data
        staring_activity = next(act for act in activities if act.name == "Prolonged Staring")
        assert staring_activity.icon == "👁️"
        assert staring_activity.conspiracy_points == Decimal("2.0")
        assert staring_activity.description is not None

    def test_seed_suspicious_activities_idempotent(self, fresh_db):
        """Test that seeding doesn't duplicate data"""
        # Seed once
        seed_suspicious_activities()
        count1 = len(SuspiciousActivityService.get_all_activities())

        # Seed again
        seed_suspicious_activities()
        count2 = len(SuspiciousActivityService.get_all_activities())

        # Should be the same count
        assert count1 == count2
        assert count1 > 0


class TestEdgeCases:
    """Test edge cases and error conditions"""

    def test_activity_log_with_max_intensity(self, sample_cat, sample_activity):
        """Test logging with maximum intensity"""
        log_data = ActivityLogCreate(
            cat_id=sample_cat.id,
            activity_id=sample_activity.id,
            intensity=5,  # Maximum
        )

        log = ActivityLogService.log_activity(log_data)
        assert log.intensity == 5

        # Verify conspiracy calculation with max intensity
        level = ConspiracyService.calculate_daily_conspiracy_level(sample_cat.id, date.today())
        assert level is not None
        expected_points = sample_activity.conspiracy_points * Decimal("5")
        assert level.total_points == expected_points

    def test_conspiracy_level_multiple_activities_same_day(self, fresh_db):
        """Test conspiracy level with multiple different activities"""
        cat = CatService.create_cat(CatCreate(name="Busy Cat"))

        # Create different activities
        act1 = SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Act1", description="Test", conspiracy_points=Decimal("2"))
        )
        act2 = SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(name="Act2", description="Test", conspiracy_points=Decimal("3"))
        )

        # Log multiple activities
        if cat.id is not None and act1.id is not None and act2.id is not None:
            ActivityLogService.log_activity(
                ActivityLogCreate(
                    cat_id=cat.id,
                    activity_id=act1.id,
                    intensity=2,  # 4 points
                )
            )
            ActivityLogService.log_activity(
                ActivityLogCreate(
                    cat_id=cat.id,
                    activity_id=act2.id,
                    intensity=3,  # 9 points
                )
            )

            level = ConspiracyService.calculate_daily_conspiracy_level(cat.id, date.today())
            assert level is not None
            assert level.total_points == Decimal("13")  # 4 + 9
            assert level.activity_count == 2

    def test_large_conspiracy_points(self, fresh_db):
        """Test with high conspiracy point values"""
        cat = CatService.create_cat(CatCreate(name="Extremely Suspicious Cat"))
        activity = SuspiciousActivityService.create_activity(
            SuspiciousActivityCreate(
                name="World Domination Plot",
                description="Clear evidence of global takeover attempt",
                conspiracy_points=Decimal("10.0"),  # Maximum allowed
            )
        )

        # Log with max intensity
        if cat.id is not None and activity.id is not None:
            ActivityLogService.log_activity(ActivityLogCreate(cat_id=cat.id, activity_id=activity.id, intensity=5))

            level = ConspiracyService.calculate_daily_conspiracy_level(cat.id, date.today())
            assert level is not None
            assert level.total_points == Decimal("50.0")  # 10 * 5
            assert "MAXIMUM ALERT" in level.conspiracy_level
