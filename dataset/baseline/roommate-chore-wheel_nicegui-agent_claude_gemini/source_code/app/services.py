"""Service layer for chore management business logic."""

import random
from datetime import datetime, date, timedelta
from typing import List, Optional
from sqlmodel import select, and_

from app.database import get_session
from app.models import (
    HouseholdMember,
    HouseholdMemberCreate,
    HouseholdMemberUpdate,
    Chore,
    ChoreCreate,
    ChoreUpdate,
    WeeklySchedule,
    WeeklyAssignment,
    ChoreStatus,
    AssignmentStats,
    WeeklyScheduleStats,
)


class MemberService:
    """Service for managing household members."""

    @staticmethod
    def create_member(member_data: HouseholdMemberCreate) -> HouseholdMember:
        """Create a new household member."""
        with get_session() as session:
            member = HouseholdMember(**member_data.model_dump())
            session.add(member)
            session.commit()
            session.refresh(member)
            return member

    @staticmethod
    def get_member(member_id: int) -> Optional[HouseholdMember]:
        """Get a household member by ID."""
        with get_session() as session:
            return session.get(HouseholdMember, member_id)

    @staticmethod
    def get_all_members(active_only: bool = True) -> List[HouseholdMember]:
        """Get all household members."""
        with get_session() as session:
            query = select(HouseholdMember)
            if active_only:
                query = query.where(HouseholdMember.is_active == True)  # noqa: E712
            return list(session.exec(query).all())

    @staticmethod
    def update_member(member_id: int, updates: HouseholdMemberUpdate) -> Optional[HouseholdMember]:
        """Update a household member."""
        with get_session() as session:
            member = session.get(HouseholdMember, member_id)
            if member is None:
                return None

            update_data = updates.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(member, field, value)

            member.updated_at = datetime.utcnow()
            session.add(member)
            session.commit()
            session.refresh(member)
            return member

    @staticmethod
    def delete_member(member_id: int) -> bool:
        """Delete a household member (soft delete by setting inactive)."""
        with get_session() as session:
            member = session.get(HouseholdMember, member_id)
            if member is None:
                return False

            member.is_active = False
            member.updated_at = datetime.utcnow()
            session.add(member)
            session.commit()
            return True


class ChoreService:
    """Service for managing chores."""

    @staticmethod
    def create_chore(chore_data: ChoreCreate) -> Chore:
        """Create a new chore."""
        with get_session() as session:
            chore = Chore(**chore_data.model_dump())
            session.add(chore)
            session.commit()
            session.refresh(chore)
            return chore

    @staticmethod
    def get_chore(chore_id: int) -> Optional[Chore]:
        """Get a chore by ID."""
        with get_session() as session:
            return session.get(Chore, chore_id)

    @staticmethod
    def get_all_chores(active_only: bool = True) -> List[Chore]:
        """Get all chores."""
        with get_session() as session:
            query = select(Chore)
            if active_only:
                query = query.where(Chore.is_active == True)  # noqa: E712
            return list(session.exec(query).all())

    @staticmethod
    def update_chore(chore_id: int, updates: ChoreUpdate) -> Optional[Chore]:
        """Update a chore."""
        with get_session() as session:
            chore = session.get(Chore, chore_id)
            if chore is None:
                return None

            update_data = updates.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(chore, field, value)

            chore.updated_at = datetime.utcnow()
            session.add(chore)
            session.commit()
            session.refresh(chore)
            return chore

    @staticmethod
    def delete_chore(chore_id: int) -> bool:
        """Delete a chore (soft delete by setting inactive)."""
        with get_session() as session:
            chore = session.get(Chore, chore_id)
            if chore is None:
                return False

            chore.is_active = False
            chore.updated_at = datetime.utcnow()
            session.add(chore)
            session.commit()
            return True


class ScheduleService:
    """Service for managing weekly schedules and assignments."""

    @staticmethod
    def get_week_start_date(date_input: date) -> date:
        """Get the Monday of the week for a given date."""
        return date_input - timedelta(days=date_input.weekday())

    @staticmethod
    def get_week_end_date(date_input: date) -> date:
        """Get the Sunday of the week for a given date."""
        week_start = ScheduleService.get_week_start_date(date_input)
        return week_start + timedelta(days=6)

    @staticmethod
    def get_current_week_schedule() -> Optional[WeeklySchedule]:
        """Get the current week's schedule."""
        today = date.today()
        week_start = ScheduleService.get_week_start_date(today)

        with get_session() as session:
            query = select(WeeklySchedule).where(WeeklySchedule.week_start_date == week_start)
            return session.exec(query).first()

    @staticmethod
    def create_weekly_schedule(week_date: Optional[date] = None, notes: str = "") -> WeeklySchedule:
        """Create a new weekly schedule."""
        if week_date is None:
            week_date = date.today()

        week_start = ScheduleService.get_week_start_date(week_date)
        week_end = ScheduleService.get_week_end_date(week_date)

        with get_session() as session:
            # Check if schedule already exists for this week
            existing = session.exec(select(WeeklySchedule).where(WeeklySchedule.week_start_date == week_start)).first()

            if existing:
                return existing

            # Set all other schedules as non-current
            session.exec(
                select(WeeklySchedule).where(WeeklySchedule.is_current == True)  # noqa: E712
            )
            current_schedules = session.exec(
                select(WeeklySchedule).where(WeeklySchedule.is_current == True)  # noqa: E712
            ).all()
            for schedule in current_schedules:
                schedule.is_current = False
                session.add(schedule)

            # Create new schedule
            schedule = WeeklySchedule(week_start_date=week_start, week_end_date=week_end, is_current=True, notes=notes)
            session.add(schedule)
            session.commit()
            session.refresh(schedule)
            return schedule

    @staticmethod
    def assign_chores_randomly(schedule: WeeklySchedule) -> List[WeeklyAssignment]:
        """Randomly assign all active chores to active members for a given schedule."""
        members = MemberService.get_all_members(active_only=True)
        chores = ChoreService.get_all_chores(active_only=True)

        if not members:
            raise ValueError("No active members available for assignment")
        if not chores:
            raise ValueError("No active chores available for assignment")

        assignments = []
        with get_session() as session:
            # Clear existing assignments for this schedule
            existing_assignments = session.exec(
                select(WeeklyAssignment).where(WeeklyAssignment.schedule_id == schedule.id)
            ).all()
            for assignment in existing_assignments:
                session.delete(assignment)

            # Create random assignments
            random.shuffle(members)  # Randomize member order
            for i, chore in enumerate(chores):
                member = members[i % len(members)]  # Rotate through members

                if schedule.id is None or chore.id is None or member.id is None:
                    raise ValueError("Missing required IDs for assignment creation")

                assignment = WeeklyAssignment(
                    schedule_id=schedule.id,
                    chore_id=chore.id,
                    member_id=member.id,
                    due_date=schedule.week_end_date,
                    status=ChoreStatus.PENDING,
                )
                session.add(assignment)
                assignments.append(assignment)

            session.commit()
            # Refresh assignments to get IDs
            for assignment in assignments:
                session.refresh(assignment)

            return assignments

    @staticmethod
    def get_schedule_assignments(schedule: WeeklySchedule) -> List[WeeklyAssignment]:
        """Get all assignments for a given schedule with related data."""
        if schedule.id is None:
            return []

        with get_session() as session:
            query = select(WeeklyAssignment).where(WeeklyAssignment.schedule_id == schedule.id)
            assignments = list(session.exec(query).all())

            # Load related data
            for assignment in assignments:
                chore = session.get(Chore, assignment.chore_id)
                member = session.get(HouseholdMember, assignment.member_id)
                # Store as attributes for access in UI
                assignment.chore = chore  # type: ignore
                assignment.member = member  # type: ignore

            return assignments

    @staticmethod
    def mark_assignment_completed(assignment_id: int, rating: Optional[int] = None) -> bool:
        """Mark an assignment as completed."""
        with get_session() as session:
            assignment = session.get(WeeklyAssignment, assignment_id)
            if assignment is None:
                return False

            assignment.status = ChoreStatus.COMPLETED
            assignment.completed_at = datetime.utcnow()
            if rating is not None:
                assignment.rating = rating

            session.add(assignment)
            session.commit()
            return True

    @staticmethod
    def update_assignment_status(assignment_id: int, status: ChoreStatus) -> bool:
        """Update the status of an assignment."""
        with get_session() as session:
            assignment = session.get(WeeklyAssignment, assignment_id)
            if assignment is None:
                return False

            assignment.status = status
            if status == ChoreStatus.COMPLETED and assignment.completed_at is None:
                assignment.completed_at = datetime.utcnow()
            elif status != ChoreStatus.COMPLETED:
                assignment.completed_at = None

            session.add(assignment)
            session.commit()
            return True

    @staticmethod
    def get_schedule_stats(schedule: WeeklySchedule) -> WeeklyScheduleStats:
        """Get statistics for a weekly schedule."""
        schedule_id = schedule.id
        if schedule_id is None:
            return WeeklyScheduleStats(
                schedule_id=0,
                week_start_date=schedule.week_start_date,
                week_end_date=schedule.week_end_date,
                total_assignments=0,
                completed_assignments=0,
                pending_assignments=0,
                overdue_assignments=0,
                completion_rate=0.0,
            )

        with get_session() as session:
            assignments = list(
                session.exec(select(WeeklyAssignment).where(WeeklyAssignment.schedule_id == schedule.id)).all()
            )

            total = len(assignments)
            completed = sum(1 for a in assignments if a.status == ChoreStatus.COMPLETED)
            pending = sum(1 for a in assignments if a.status == ChoreStatus.PENDING)
            overdue = sum(1 for a in assignments if a.status == ChoreStatus.OVERDUE)

            completion_rate = (completed / total * 100) if total > 0 else 0.0

            return WeeklyScheduleStats(
                schedule_id=schedule_id,
                week_start_date=schedule.week_start_date,
                week_end_date=schedule.week_end_date,
                total_assignments=total,
                completed_assignments=completed,
                pending_assignments=pending,
                overdue_assignments=overdue,
                completion_rate=completion_rate,
            )

    @staticmethod
    def get_member_assignment_stats(member_id: int, weeks_back: int = 4) -> AssignmentStats:
        """Get assignment statistics for a member over the past N weeks."""
        cutoff_date = date.today() - timedelta(weeks=weeks_back)

        with get_session() as session:
            member = session.get(HouseholdMember, member_id)
            if member is None:
                raise ValueError(f"Member with ID {member_id} not found")

            assignments = list(
                session.exec(
                    select(WeeklyAssignment)
                    .join(WeeklySchedule)
                    .where(and_(WeeklyAssignment.member_id == member_id, WeeklySchedule.week_start_date >= cutoff_date))
                ).all()
            )

            total = len(assignments)
            completed = sum(1 for a in assignments if a.status == ChoreStatus.COMPLETED)

            # Calculate average rating
            ratings = [a.rating for a in assignments if a.rating is not None]
            avg_rating = sum(ratings) / len(ratings) if ratings else None

            # Calculate total estimated minutes
            total_minutes = 0
            for assignment in assignments:
                chore = session.get(Chore, assignment.chore_id)
                if chore and chore.estimated_minutes:
                    total_minutes += chore.estimated_minutes

            completion_rate = (completed / total * 100) if total > 0 else 0.0

            return AssignmentStats(
                member_id=member_id,
                member_name=member.name,
                total_assignments=total,
                completed_assignments=completed,
                completion_rate=completion_rate,
                average_rating=avg_rating,
                total_estimated_minutes=total_minutes,
            )
