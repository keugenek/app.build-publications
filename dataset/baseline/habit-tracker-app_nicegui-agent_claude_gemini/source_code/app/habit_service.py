from datetime import date, timedelta
from typing import Optional, List
import logging
from sqlmodel import Session, select, desc
from app.database import get_session
from app.models import Habit, HabitCheckIn, HabitCreate, HabitUpdate, HabitWithStreak

logger = logging.getLogger(__name__)


class HabitService:
    """Service layer for habit management operations"""

    def __init__(self, session: Optional[Session] = None):
        self.session = session or get_session()

    def create_habit(self, habit_data: HabitCreate) -> Optional[Habit]:
        """Create a new habit"""
        try:
            habit = Habit(name=habit_data.name.strip())
            self.session.add(habit)
            self.session.commit()
            self.session.refresh(habit)
            return habit
        except Exception as e:
            logger.error(f"Error in database operation: {e}")
            self.session.rollback()
            return None

    def get_habit(self, habit_id: int) -> Optional[Habit]:
        """Get habit by ID"""
        return self.session.get(Habit, habit_id)

    def get_all_habits(self, include_inactive: bool = False) -> List[HabitWithStreak]:
        """Get all habits with their current streaks"""
        query = select(Habit)
        if not include_inactive:
            query = query.where(Habit.is_active)

        habits = self.session.exec(query).all()

        habits_with_streaks = []
        for habit in habits:
            streak_data = self._calculate_streak(habit)
            habits_with_streaks.append(
                HabitWithStreak(
                    id=habit.id or 0,
                    name=habit.name,
                    created_at=habit.created_at,
                    is_active=habit.is_active,
                    current_streak=streak_data["current_streak"],
                    last_check_in=streak_data["last_check_in"],
                    total_check_ins=streak_data["total_check_ins"],
                )
            )

        return habits_with_streaks

    def update_habit(self, habit_id: int, habit_data: HabitUpdate) -> Optional[Habit]:
        """Update existing habit"""
        habit = self.get_habit(habit_id)
        if habit is None:
            return None

        try:
            if habit_data.name is not None:
                habit.name = habit_data.name.strip()
            if habit_data.is_active is not None:
                habit.is_active = habit_data.is_active

            self.session.commit()
            self.session.refresh(habit)
            return habit
        except Exception as e:
            logger.error(f"Error in database operation: {e}")
            self.session.rollback()
            return None

    def delete_habit(self, habit_id: int) -> bool:
        """Delete habit and all its check-ins"""
        habit = self.get_habit(habit_id)
        if habit is None:
            return False

        try:
            # Delete all check-ins first
            check_ins = self.session.exec(select(HabitCheckIn).where(HabitCheckIn.habit_id == habit_id)).all()
            for check_in in check_ins:
                self.session.delete(check_in)

            # Delete habit
            self.session.delete(habit)
            self.session.commit()
            return True
        except Exception as e:
            logger.error(f"Error in database operation: {e}")
            self.session.rollback()
            return False

    def check_in_habit(self, habit_id: int, check_date: Optional[date] = None) -> Optional[HabitCheckIn]:
        """Record a check-in for a habit on a specific date"""
        habit = self.get_habit(habit_id)
        if habit is None or not habit.is_active:
            return None

        target_date = check_date or date.today()

        # Check if already checked in for this date
        existing = self.session.exec(
            select(HabitCheckIn).where(HabitCheckIn.habit_id == habit_id, HabitCheckIn.check_in_date == target_date)
        ).first()

        if existing:
            return existing

        try:
            check_in = HabitCheckIn(habit_id=habit_id, check_in_date=target_date)
            self.session.add(check_in)
            self.session.commit()
            self.session.refresh(check_in)
            return check_in
        except Exception as e:
            logger.error(f"Error in database operation: {e}")
            self.session.rollback()
            return None

    def undo_check_in(self, habit_id: int, check_date: Optional[date] = None) -> bool:
        """Remove check-in for a habit on a specific date"""
        target_date = check_date or date.today()

        check_in = self.session.exec(
            select(HabitCheckIn).where(HabitCheckIn.habit_id == habit_id, HabitCheckIn.check_in_date == target_date)
        ).first()

        if check_in is None:
            return False

        try:
            self.session.delete(check_in)
            self.session.commit()
            return True
        except Exception as e:
            logger.error(f"Error in database operation: {e}")
            self.session.rollback()
            return False

    def is_checked_in_today(self, habit_id: int) -> bool:
        """Check if habit is already checked in for today"""
        today = date.today()
        check_in = self.session.exec(
            select(HabitCheckIn).where(HabitCheckIn.habit_id == habit_id, HabitCheckIn.check_in_date == today)
        ).first()
        return check_in is not None

    def get_habit_history(self, habit_id: int, days: int = 30) -> List[date]:
        """Get list of dates when habit was completed in the last N days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        check_ins = self.session.exec(
            select(HabitCheckIn).where(
                HabitCheckIn.habit_id == habit_id,
                HabitCheckIn.check_in_date >= start_date,
                HabitCheckIn.check_in_date <= end_date,
            )
        ).all()

        return [check_in.check_in_date for check_in in check_ins]

    def _calculate_streak(self, habit: Habit) -> dict:
        """Calculate current streak, last check-in date, and total check-ins for a habit"""
        if habit.id is None:
            return {"current_streak": 0, "last_check_in": None, "total_check_ins": 0}

        # Get all check-ins for this habit, ordered by date descending
        check_ins = self.session.exec(
            select(HabitCheckIn).where(HabitCheckIn.habit_id == habit.id).order_by(desc(HabitCheckIn.check_in_date))
        ).all()

        if not check_ins:
            return {"current_streak": 0, "last_check_in": None, "total_check_ins": 0}

        total_check_ins = len(check_ins)
        last_check_in = check_ins[0].check_in_date

        # Calculate current streak
        current_streak = 0
        today = date.today()
        expected_date = today

        # If not checked in today, start from yesterday
        if not any(ci.check_in_date == today for ci in check_ins):
            expected_date = today - timedelta(days=1)

        # Count consecutive days working backwards
        check_in_dates = {ci.check_in_date for ci in check_ins}

        while expected_date in check_in_dates:
            current_streak += 1
            expected_date -= timedelta(days=1)

        return {"current_streak": current_streak, "last_check_in": last_check_in, "total_check_ins": total_check_ins}

    def close(self):
        """Close the database session"""
        self.session.close()
