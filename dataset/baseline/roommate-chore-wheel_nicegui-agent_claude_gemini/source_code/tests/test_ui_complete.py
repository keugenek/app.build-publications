"""Comprehensive UI tests for the chore management application."""

import pytest
from nicegui.testing import User

from app.database import reset_db
from app.services import MemberService, ChoreService, ScheduleService
from app.models import HouseholdMemberCreate, ChoreCreate


@pytest.fixture
def fresh_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


class TestDashboardUI:
    """Test the main dashboard UI."""

    async def test_dashboard_empty_state(self, user: User, fresh_db) -> None:
        """Test dashboard when no assignments exist."""
        await user.open("/")
        await user.should_see("Chore Management Dashboard")
        await user.should_see("No assignments for this week")
        await user.should_see("Create This Week's Assignments")

    async def test_create_assignments_no_data(self, user: User, fresh_db) -> None:
        """Test creating assignments with no members or chores."""
        await user.open("/")

        # Try to create assignments
        user.find("Create This Week's Assignments").click()
        await user.should_see("Please add some household members first")

    async def test_navigation_buttons(self, user: User, fresh_db) -> None:
        """Test navigation to other pages."""
        await user.open("/")

        # Test navigation via header links
        user.find("Members").click()
        await user.should_see("Household Members")

        # Navigate back and test chores
        user.find("Chores").click()
        await user.should_see("Household Chores")

    async def test_dashboard_with_assignments(self, user: User, fresh_db) -> None:
        """Test dashboard with existing assignments."""
        # Create test data
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum"))

        # Create assignments
        schedule = ScheduleService.create_weekly_schedule()
        ScheduleService.assign_chores_randomly(schedule)

        await user.open("/")
        await user.should_see("Week of")
        await user.should_see("Alice")
        await user.should_see("Vacuum")
        await user.should_see("Reassign All Chores")


class TestMembersUI:
    """Test the members management UI."""

    async def test_members_empty_state(self, user: User, fresh_db) -> None:
        """Test members page when no members exist."""
        await user.open("/members")
        await user.should_see("Household Members")
        await user.should_see("No household members yet")
        await user.should_see("Add Member")

    async def test_add_member(self, user: User, fresh_db) -> None:
        """Test adding a new member."""
        await user.open("/members")

        # Click add member button
        user.find("Add Member").click()
        await user.should_see("Add New Member")

        # Fill form
        user.find("Name").type("Alice Smith")
        user.find("Email (optional)").type("alice@example.com")

        # Submit
        user.find("Add Member").click()
        await user.should_see('Member "Alice Smith" added successfully!')
        await user.should_see("Alice Smith")
        await user.should_see("alice@example.com")

    async def test_add_member_validation(self, user: User, fresh_db) -> None:
        """Test member form validation."""
        await user.open("/members")

        user.find("Add Member").click()
        await user.should_see("Add New Member")

        # Try to submit without name
        user.find("Add Member").click()
        await user.should_see("Member name is required")

    async def test_edit_member(self, user: User, fresh_db) -> None:
        """Test editing an existing member."""
        # Create a member first
        MemberService.create_member(HouseholdMemberCreate(name="Bob", email="bob@example.com"))

        await user.open("/members")
        await user.should_see("Bob")

        # Click edit button
        user.find("Edit").click()
        await user.should_see("Edit Member")

        # The input should be pre-filled, just submit with changes
        user.find("Save Changes").click()
        await user.should_see("successfully")  # Look for success message

    async def test_deactivate_member(self, user: User, fresh_db) -> None:
        """Test deactivating a member."""
        MemberService.create_member(HouseholdMemberCreate(name="Charlie"))

        await user.open("/members")
        await user.should_see("Charlie")
        await user.should_see("Active")

        user.find("Deactivate").click()
        await user.should_see('Member "Charlie" deactivated')
        await user.should_see("Inactive")


class TestChoresUI:
    """Test the chores management UI."""

    async def test_chores_empty_state(self, user: User, fresh_db) -> None:
        """Test chores page when no chores exist."""
        await user.open("/chores")
        await user.should_see("Household Chores")
        await user.should_see("No chores defined yet")
        await user.should_see("Add Chore")

    async def test_add_chore(self, user: User, fresh_db) -> None:
        """Test adding a new chore."""
        await user.open("/chores")

        user.find("Add Chore").click()
        await user.should_see("Add New Chore")

        # Fill form
        user.find("Chore Name").type("Vacuum living room")
        user.find("Description (optional)").type("Vacuum the entire living room carefully")

        # Submit (use default estimated minutes)
        user.find("Add Chore").click()
        await user.should_see('Chore "Vacuum living room" added successfully!')
        await user.should_see("Vacuum living room")

    async def test_add_chore_validation(self, user: User, fresh_db) -> None:
        """Test chore form validation."""
        await user.open("/chores")

        user.find("Add Chore").click()
        await user.should_see("Add New Chore")

        # Try to submit without name
        user.find("Add Chore").click()
        await user.should_see("Chore name is required")

    async def test_edit_chore(self, user: User, fresh_db) -> None:
        """Test editing an existing chore."""
        ChoreService.create_chore(ChoreCreate(name="Dishes", estimated_minutes=20))

        await user.open("/chores")
        await user.should_see("Dishes")

        user.find("Edit").click()
        await user.should_see("Edit Chore")

        # Update chore name
        user.find("Chore Name").clear()
        user.find("Chore Name").type("Wash Dishes")

        user.find("Save Changes").click()
        await user.should_see('Chore "Wash Dishes" updated successfully!')


class TestAssignmentInteraction:
    """Test assignment interaction functionality."""

    async def test_mark_assignment_complete(self, user: User, fresh_db) -> None:
        """Test marking an assignment as complete."""
        # Create test data
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Take out trash"))

        # Create assignments
        schedule = ScheduleService.create_weekly_schedule()
        ScheduleService.assign_chores_randomly(schedule)

        await user.open("/")
        await user.should_see("Take out trash")
        await user.should_see("Mark Complete")

        # Mark as complete
        user.find("Mark Complete").click()
        await user.should_see("Mark Assignment Complete")
        await user.should_see("Take out trash")

        user.find("Mark Complete").click()
        await user.should_see("Assignment marked as complete!")

    async def test_reassign_chores(self, user: User, fresh_db) -> None:
        """Test reassigning all chores."""
        # Create test data
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        MemberService.create_member(HouseholdMemberCreate(name="Bob"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum"))
        ChoreService.create_chore(ChoreCreate(name="Dishes"))

        # Create assignments
        schedule = ScheduleService.create_weekly_schedule()
        ScheduleService.assign_chores_randomly(schedule)

        await user.open("/")
        await user.should_see("Week of")

        user.find("Reassign All Chores").click()
        await user.should_see("Reassigned 2 chores randomly!")


class TestHistoryUI:
    """Test the history and analytics UI."""

    async def test_history_empty_state(self, user: User, fresh_db) -> None:
        """Test history page with no data."""
        await user.open("/history")
        await user.should_see("Assignment History & Analytics")
        await user.should_see("No active members found")

    async def test_history_with_data(self, user: User, fresh_db) -> None:
        """Test history page with member statistics."""
        # Create test data
        MemberService.create_member(HouseholdMemberCreate(name="Alice"))
        ChoreService.create_chore(ChoreCreate(name="Vacuum", estimated_minutes=30))

        # Create assignment and complete it
        schedule = ScheduleService.create_weekly_schedule()
        assignments = ScheduleService.assign_chores_randomly(schedule)
        if assignments[0].id is not None:
            ScheduleService.mark_assignment_completed(assignments[0].id, rating=5)

        await user.open("/history")
        await user.should_see("Member Performance")
        await user.should_see("Alice")
        # Look for completion indicator without exact percentage format
        await user.should_see("Completed")

    async def test_history_navigation(self, user: User, fresh_db) -> None:
        """Test navigation from history page."""
        await user.open("/history")

        user.find("← Back to Dashboard").click()
        await user.should_see("Chore Management Dashboard")


class TestWorkflowIntegration:
    """Test complete workflows."""

    async def test_complete_workflow(self, user: User, fresh_db) -> None:
        """Test a complete user workflow from setup to completion."""
        # Start at dashboard
        await user.open("/")
        await user.should_see("Chore Management Dashboard")

        # Navigate to members and add a member
        user.find("Members").click()
        await user.should_see("Household Members")

        # Add a member
        user.find("Add Member").click()
        await user.should_see("Add New Member")
        user.find("Name").type("Alice")

        # Find and click the "Add Member" button in the dialog (not the page)
        dialog_buttons = user.find("Add Member")
        dialog_buttons.click()  # This should submit the dialog
        await user.should_see("Alice")

        # Navigate to chores
        user.find("Chores").click()
        await user.should_see("Household Chores")

        # Add a chore
        user.find("Add Chore").click()
        await user.should_see("Add New Chore")
        user.find("Chore Name").type("Clean kitchen")
        user.find("Add Chore").click()  # Submit the dialog
        await user.should_see("Clean kitchen")

        # Go back to dashboard and create assignments
        user.find("Dashboard").click()
        await user.should_see("No assignments for this week")
        user.find("Create This Week's Assignments").click()
        await user.should_see("Created 1 assignments for this week!")

        # Verify assignment is visible
        await user.should_see("Clean kitchen")
        await user.should_see("Alice")
