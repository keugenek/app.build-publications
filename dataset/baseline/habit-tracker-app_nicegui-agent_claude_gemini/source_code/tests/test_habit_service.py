from datetime import date, timedelta
import pytest
from app.database import reset_db, get_session
from app.habit_service import HabitService
from app.models import HabitCreate, HabitUpdate


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


@pytest.fixture()
def habit_service(new_db):
    session = get_session()
    service = HabitService(session)
    yield service
    service.close()


class TestHabitCreation:
    def test_create_habit_success(self, habit_service):
        habit_data = HabitCreate(name="Exercise Daily")
        habit = habit_service.create_habit(habit_data)

        assert habit is not None
        assert habit.name == "Exercise Daily"
        assert habit.is_active
        assert habit.id is not None

    def test_create_habit_strips_whitespace(self, habit_service):
        habit_data = HabitCreate(name="  Read Books  ")
        habit = habit_service.create_habit(habit_data)

        assert habit is not None
        assert habit.name == "Read Books"

    def test_create_empty_name_habit(self, habit_service):
        habit_data = HabitCreate(name="")
        habit = habit_service.create_habit(habit_data)

        assert habit is not None
        assert habit.name == ""


class TestHabitRetrieval:
    def test_get_habit_existing(self, habit_service):
        # Create a habit first
        habit_data = HabitCreate(name="Morning Meditation")
        created_habit = habit_service.create_habit(habit_data)
        assert created_habit is not None

        # Retrieve it
        retrieved_habit = habit_service.get_habit(created_habit.id)
        assert retrieved_habit is not None
        assert retrieved_habit.name == "Morning Meditation"

    def test_get_habit_nonexistent(self, habit_service):
        habit = habit_service.get_habit(999)
        assert habit is None

    def test_get_all_habits_empty(self, habit_service):
        habits = habit_service.get_all_habits()
        assert habits == []

    def test_get_all_habits_with_data(self, habit_service):
        # Create multiple habits
        habit1 = habit_service.create_habit(HabitCreate(name="Habit 1"))
        habit2 = habit_service.create_habit(HabitCreate(name="Habit 2"))
        assert habit1 is not None and habit2 is not None

        habits = habit_service.get_all_habits()
        assert len(habits) == 2
        assert habits[0].name == "Habit 1"
        assert habits[1].name == "Habit 2"
        assert habits[0].current_streak == 0
        assert habits[0].total_check_ins == 0

    def test_get_all_habits_excludes_inactive(self, habit_service):
        # Create active and inactive habits
        active_habit = habit_service.create_habit(HabitCreate(name="Active"))
        inactive_habit = habit_service.create_habit(HabitCreate(name="Inactive"))
        assert active_habit is not None and inactive_habit is not None

        # Deactivate one habit
        habit_service.update_habit(inactive_habit.id, HabitUpdate(is_active=False))

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].name == "Active"

    def test_get_all_habits_includes_inactive_when_requested(self, habit_service):
        # Create active and inactive habits
        active_habit = habit_service.create_habit(HabitCreate(name="Active"))
        inactive_habit = habit_service.create_habit(HabitCreate(name="Inactive"))
        assert active_habit is not None and inactive_habit is not None

        # Deactivate one habit
        habit_service.update_habit(inactive_habit.id, HabitUpdate(is_active=False))

        habits = habit_service.get_all_habits(include_inactive=True)
        assert len(habits) == 2


class TestHabitUpdate:
    def test_update_habit_name(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Old Name"))
        assert habit is not None

        updated_habit = habit_service.update_habit(habit.id, HabitUpdate(name="New Name"))
        assert updated_habit is not None
        assert updated_habit.name == "New Name"

    def test_update_habit_active_status(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test Habit"))
        assert habit is not None and habit.is_active

        updated_habit = habit_service.update_habit(habit.id, HabitUpdate(is_active=False))
        assert updated_habit is not None
        assert not updated_habit.is_active

    def test_update_nonexistent_habit(self, habit_service):
        updated_habit = habit_service.update_habit(999, HabitUpdate(name="New Name"))
        assert updated_habit is None

    def test_update_habit_strips_whitespace(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        updated_habit = habit_service.update_habit(habit.id, HabitUpdate(name="  Updated Name  "))
        assert updated_habit is not None
        assert updated_habit.name == "Updated Name"


class TestHabitDeletion:
    def test_delete_habit_success(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="To Delete"))
        assert habit is not None

        # Add a check-in
        check_in = habit_service.check_in_habit(habit.id)
        assert check_in is not None

        # Delete habit
        result = habit_service.delete_habit(habit.id)
        assert result

        # Verify it's gone
        deleted_habit = habit_service.get_habit(habit.id)
        assert deleted_habit is None

    def test_delete_nonexistent_habit(self, habit_service):
        result = habit_service.delete_habit(999)
        assert not result


class TestHabitCheckIns:
    def test_check_in_habit_today(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Daily Exercise"))
        assert habit is not None

        check_in = habit_service.check_in_habit(habit.id)
        assert check_in is not None
        assert check_in.check_in_date == date.today()
        assert check_in.habit_id == habit.id

    def test_check_in_habit_specific_date(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Reading"))
        assert habit is not None

        yesterday = date.today() - timedelta(days=1)
        check_in = habit_service.check_in_habit(habit.id, yesterday)
        assert check_in is not None
        assert check_in.check_in_date == yesterday

    def test_check_in_habit_duplicate_same_date(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Water Plants"))
        assert habit is not None

        # First check-in
        check_in1 = habit_service.check_in_habit(habit.id)
        assert check_in1 is not None

        # Second check-in same day - should return existing
        check_in2 = habit_service.check_in_habit(habit.id)
        assert check_in2 is not None
        assert check_in1.id == check_in2.id

    def test_check_in_nonexistent_habit(self, habit_service):
        check_in = habit_service.check_in_habit(999)
        assert check_in is None

    def test_check_in_inactive_habit(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Inactive Habit"))
        assert habit is not None

        # Deactivate habit
        habit_service.update_habit(habit.id, HabitUpdate(is_active=False))

        # Try to check in
        check_in = habit_service.check_in_habit(habit.id)
        assert check_in is None

    def test_is_checked_in_today_true(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        habit_service.check_in_habit(habit.id)
        assert habit_service.is_checked_in_today(habit.id)

    def test_is_checked_in_today_false(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        assert not habit_service.is_checked_in_today(habit.id)

    def test_undo_check_in_success(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        # Check in first
        habit_service.check_in_habit(habit.id)
        assert habit_service.is_checked_in_today(habit.id)

        # Undo check-in
        result = habit_service.undo_check_in(habit.id)
        assert result
        assert not habit_service.is_checked_in_today(habit.id)

    def test_undo_check_in_no_existing(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        result = habit_service.undo_check_in(habit.id)
        assert not result

    def test_undo_check_in_specific_date(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        yesterday = date.today() - timedelta(days=1)
        habit_service.check_in_habit(habit.id, yesterday)

        result = habit_service.undo_check_in(habit.id, yesterday)
        assert result


class TestStreakCalculation:
    def test_streak_no_checkins(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="New Habit"))
        assert habit is not None

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].current_streak == 0
        assert habits[0].last_check_in is None

    def test_streak_single_checkin_today(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Exercise"))
        assert habit is not None

        habit_service.check_in_habit(habit.id)

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].current_streak == 1
        assert habits[0].last_check_in == date.today()

    def test_streak_consecutive_days(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Reading"))
        assert habit is not None

        # Check in for last 3 days
        for days_ago in range(2, -1, -1):  # 2, 1, 0 (yesterday, today)
            check_date = date.today() - timedelta(days=days_ago)
            habit_service.check_in_habit(habit.id, check_date)

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].current_streak == 3

    def test_streak_broken_sequence(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Meditation"))
        assert habit is not None

        # Check in today and 3 days ago (missing yesterday and day before)
        habit_service.check_in_habit(habit.id, date.today())
        habit_service.check_in_habit(habit.id, date.today() - timedelta(days=3))

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].current_streak == 1  # Only today counts in streak

    def test_streak_not_checked_in_today(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Exercise"))
        assert habit is not None

        # Check in yesterday and day before
        yesterday = date.today() - timedelta(days=1)
        day_before = date.today() - timedelta(days=2)
        habit_service.check_in_habit(habit.id, yesterday)
        habit_service.check_in_habit(habit.id, day_before)

        habits = habit_service.get_all_habits()
        assert len(habits) == 1
        assert habits[0].current_streak == 2
        assert habits[0].last_check_in == yesterday


class TestHabitHistory:
    def test_get_habit_history_empty(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Test"))
        assert habit is not None

        history = habit_service.get_habit_history(habit.id)
        assert history == []

    def test_get_habit_history_with_data(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Exercise"))
        assert habit is not None

        # Add check-ins for last 3 days
        dates = []
        for days_ago in range(2, -1, -1):
            check_date = date.today() - timedelta(days=days_ago)
            habit_service.check_in_habit(habit.id, check_date)
            dates.append(check_date)

        history = habit_service.get_habit_history(habit.id, days=30)
        assert len(history) == 3
        assert history == dates

    def test_get_habit_history_limited_days(self, habit_service):
        habit = habit_service.create_habit(HabitCreate(name="Reading"))
        assert habit is not None

        # Add check-ins for last 5 days
        for days_ago in range(4, -1, -1):
            check_date = date.today() - timedelta(days=days_ago)
            habit_service.check_in_habit(habit.id, check_date)

        # Request only last 3 days
        history = habit_service.get_habit_history(habit.id, days=3)
        assert len(history) == 3

        # Should include today, yesterday, and day before yesterday
        expected_dates = [date.today() - timedelta(days=2), date.today() - timedelta(days=1), date.today()]
        assert history == expected_dates
