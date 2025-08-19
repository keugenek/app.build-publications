"""Tests for service layer business logic."""

import pytest
from datetime import date, timedelta

from app.database import reset_db
from app.services import MemberService, ChoreService, ScheduleService
from app.models import HouseholdMemberCreate, HouseholdMemberUpdate, ChoreCreate, ChoreUpdate, ChoreStatus


@pytest.fixture
def fresh_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


class TestMemberService:
    """Test member management service."""

    def test_create_member(self, fresh_db):
        """Test creating a new member."""
        member_data = HouseholdMemberCreate(name="Alice", email="alice@example.com")
        member = MemberService.create_member(member_data)

        assert member.id is not None
        assert member.name == "Alice"
        assert member.email == "alice@example.com"
        assert member.is_active

    def test_create_member_no_email(self, fresh_db):
        """Test creating a member without email."""
        member_data = HouseholdMemberCreate(name="Bob")
        member = MemberService.create_member(member_data)

        assert member.id is not None
        assert member.name == "Bob"
        assert member.email is None
        assert member.is_active

    def test_get_member(self, fresh_db):
        """Test retrieving a member by ID."""
        member_data = HouseholdMemberCreate(name="Charlie")
        created_member = MemberService.create_member(member_data)

        if created_member.id is not None:
            retrieved_member = MemberService.get_member(created_member.id)
            assert retrieved_member is not None
            assert retrieved_member.name == "Charlie"
        else:
            pytest.fail("Created member should have an ID")

    def test_get_nonexistent_member(self, fresh_db):
        """Test retrieving a non-existent member."""
        member = MemberService.get_member(999)
        assert member is None

    def test_get_all_members(self, fresh_db):
        """Test retrieving all members."""
        # Create test members
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        MemberService.create_member(HouseholdMemberCreate(name="Bob"))

        members = MemberService.get_all_members(active_only=True)
        assert len(members) == 2
        names = [m.name for m in members]
        assert "Alice" in names
        assert "Bob" in names

    def test_update_member(self, fresh_db):
        """Test updating a member."""
        member = MemberService.create_member(HouseholdMemberCreate(name="David"))

        if member.id is not None:
            updates = HouseholdMemberUpdate(name="David Updated", email="david@example.com")
            updated_member = MemberService.update_member(member.id, updates)

            assert updated_member is not None
            assert updated_member.name == "David Updated"
            assert updated_member.email == "david@example.com"
        else:
            pytest.fail("Member should have an ID")

    def test_update_nonexistent_member(self, fresh_db):
        """Test updating a non-existent member."""
        updates = HouseholdMemberUpdate(name="Ghost")
        result = MemberService.update_member(999, updates)
        assert result is None

    def test_delete_member(self, fresh_db):
        """Test soft-deleting a member."""
        member = MemberService.create_member(HouseholdMemberCreate(name="Eve"))

        if member.id is not None:
            success = MemberService.delete_member(member.id)
            assert success

            # Member should still exist but inactive
            deleted_member = MemberService.get_member(member.id)
            assert deleted_member is not None
            assert not deleted_member.is_active

            # Should not appear in active members
            active_members = MemberService.get_all_members(active_only=True)
            assert len(active_members) == 0
        else:
            pytest.fail("Member should have an ID")


class TestChoreService:
    """Test chore management service."""

    def test_create_chore(self, fresh_db):
        """Test creating a new chore."""
        chore_data = ChoreCreate(
            name="Vacuum living room",
            description="Vacuum the entire living room",
            estimated_minutes=30,
            difficulty_level=2,
        )
        chore = ChoreService.create_chore(chore_data)

        assert chore.id is not None
        assert chore.name == "Vacuum living room"
        assert chore.description == "Vacuum the entire living room"
        assert chore.estimated_minutes == 30
        assert chore.difficulty_level == 2
        assert chore.is_active

    def test_create_minimal_chore(self, fresh_db):
        """Test creating a chore with minimal data."""
        chore_data = ChoreCreate(name="Take out trash")
        chore = ChoreService.create_chore(chore_data)

        assert chore.id is not None
        assert chore.name == "Take out trash"
        assert chore.description == ""
        assert chore.estimated_minutes is None
        assert chore.difficulty_level == 1

    def test_get_chore(self, fresh_db):
        """Test retrieving a chore by ID."""
        chore_data = ChoreCreate(name="Dishes")
        created_chore = ChoreService.create_chore(chore_data)

        if created_chore.id is not None:
            retrieved_chore = ChoreService.get_chore(created_chore.id)
            assert retrieved_chore is not None
            assert retrieved_chore.name == "Dishes"
        else:
            pytest.fail("Created chore should have an ID")

    def test_update_chore(self, fresh_db):
        """Test updating a chore."""
        chore = ChoreService.create_chore(ChoreCreate(name="Laundry"))

        if chore.id is not None:
            updates = ChoreUpdate(
                name="Laundry Updated", description="Wash and fold clothes", estimated_minutes=60, difficulty_level=3
            )
            updated_chore = ChoreService.update_chore(chore.id, updates)

            assert updated_chore is not None
            assert updated_chore.name == "Laundry Updated"
            assert updated_chore.description == "Wash and fold clothes"
            assert updated_chore.estimated_minutes == 60
            assert updated_chore.difficulty_level == 3
        else:
            pytest.fail("Chore should have an ID")

    def test_delete_chore(self, fresh_db):
        """Test soft-deleting a chore."""
        chore = ChoreService.create_chore(ChoreCreate(name="Clean bathroom"))

        if chore.id is not None:
            success = ChoreService.delete_chore(chore.id)
            assert success

            # Chore should still exist but inactive
            deleted_chore = ChoreService.get_chore(chore.id)
            assert deleted_chore is not None
            assert not deleted_chore.is_active


class TestScheduleService:
    """Test schedule and assignment service."""

    def test_get_week_start_date(self, fresh_db):
        """Test getting Monday of the week."""
        # Test with a Wednesday (should return the previous Monday)
        wednesday = date(2024, 1, 10)  # Assuming this is a Wednesday
        monday = ScheduleService.get_week_start_date(wednesday)
        assert monday.weekday() == 0  # Monday is 0

        # Test with a Monday (should return the same date)
        monday_input = date(2024, 1, 8)
        monday_output = ScheduleService.get_week_start_date(monday_input)
        assert monday_input == monday_output

    def test_get_week_end_date(self, fresh_db):
        """Test getting Sunday of the week."""
        wednesday = date(2024, 1, 10)
        sunday = ScheduleService.get_week_end_date(wednesday)
        assert sunday.weekday() == 6  # Sunday is 6

    def test_create_weekly_schedule(self, fresh_db):
        """Test creating a weekly schedule."""
        test_date = date(2024, 1, 10)
        schedule = ScheduleService.create_weekly_schedule(test_date, "Test week")

        assert schedule.id is not None
        assert schedule.week_start_date.weekday() == 0  # Monday
        assert schedule.week_end_date.weekday() == 6  # Sunday
        assert schedule.is_current
        assert schedule.notes == "Test week"

    def test_create_duplicate_weekly_schedule(self, fresh_db):
        """Test creating a schedule for the same week twice."""
        test_date = date(2024, 1, 10)
        schedule1 = ScheduleService.create_weekly_schedule(test_date, "First")
        schedule2 = ScheduleService.create_weekly_schedule(test_date, "Second")

        # Should return the existing schedule
        assert schedule1.id == schedule2.id

    def test_assign_chores_randomly(self, fresh_db):
        """Test random chore assignment."""
        # Create test data
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        MemberService.create_member(HouseholdMemberCreate(name="Bob"))

        ChoreService.create_chore(ChoreCreate(name="Vacuum"))
        ChoreService.create_chore(ChoreCreate(name="Dishes"))
        ChoreService.create_chore(ChoreCreate(name="Laundry"))

        schedule = ScheduleService.create_weekly_schedule()
        assignments = ScheduleService.assign_chores_randomly(schedule)

        assert len(assignments) == 3  # Should have 3 assignments

        # All assignments should be for this schedule
        for assignment in assignments:
            assert assignment.schedule_id == schedule.id
            assert assignment.status == ChoreStatus.PENDING

    def test_assign_chores_no_members(self, fresh_db):
        """Test chore assignment with no active members."""
        ChoreService.create_chore(ChoreCreate(name="Vacuum"))
        schedule = ScheduleService.create_weekly_schedule()

        with pytest.raises(ValueError, match="No active members available"):
            ScheduleService.assign_chores_randomly(schedule)

    def test_assign_chores_no_chores(self, fresh_db):
        """Test chore assignment with no active chores."""
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        schedule = ScheduleService.create_weekly_schedule()

        with pytest.raises(ValueError, match="No active chores available"):
            ScheduleService.assign_chores_randomly(schedule)

    def test_mark_assignment_completed(self, fresh_db):
        """Test marking an assignment as completed."""
        # Setup
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum"))
        schedule = ScheduleService.create_weekly_schedule()
        assignments = ScheduleService.assign_chores_randomly(schedule)

        assignment = assignments[0]
        if assignment.id is not None:
            success = ScheduleService.mark_assignment_completed(assignment.id, rating=4)
            assert success

            # Verify assignment was updated
            assignments = ScheduleService.get_schedule_assignments(schedule)
            updated_assignment = assignments[0]
            assert updated_assignment.status == ChoreStatus.COMPLETED
            assert updated_assignment.completed_at is not None
            assert updated_assignment.rating == 4
        else:
            pytest.fail("Assignment should have an ID")

    def test_get_schedule_stats(self, fresh_db):
        """Test getting schedule statistics."""
        # Setup
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum"))
        ChoreService.create_chore(ChoreCreate(name="Dishes"))

        schedule = ScheduleService.create_weekly_schedule()
        assignments = ScheduleService.assign_chores_randomly(schedule)

        # Mark one as completed
        if assignments[0].id is not None:
            ScheduleService.mark_assignment_completed(assignments[0].id)

        stats = ScheduleService.get_schedule_stats(schedule)

        assert stats.total_assignments == 2
        assert stats.completed_assignments == 1
        assert stats.pending_assignments == 1
        assert stats.completion_rate == 50.0

    def test_get_member_assignment_stats(self, fresh_db):
        """Test getting member assignment statistics."""
        # Setup
        member = MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum", estimated_minutes=30))

        # Create schedule for last week
        last_week = date.today() - timedelta(weeks=1)
        schedule = ScheduleService.create_weekly_schedule(last_week)
        assignments = ScheduleService.assign_chores_randomly(schedule)

        # Complete the assignment with rating
        if assignments[0].id is not None and member.id is not None:
            ScheduleService.mark_assignment_completed(assignments[0].id, rating=5)

            stats = ScheduleService.get_member_assignment_stats(member.id)

            assert stats.member_name == "Alice"
            assert stats.total_assignments == 1
            assert stats.completed_assignments == 1
            assert stats.completion_rate == 100.0
            assert stats.average_rating == 5.0
            assert stats.total_estimated_minutes == 30
        else:
            pytest.fail("Assignment and member should have IDs")
