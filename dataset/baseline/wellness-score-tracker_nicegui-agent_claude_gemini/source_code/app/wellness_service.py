from sqlmodel import select, desc, asc
from datetime import datetime, date, timedelta
from typing import Optional, List
from decimal import Decimal

from app.database import get_session
from app.models import User, WellnessEntry, WellnessEntryCreate, WellnessEntryUpdate, WellnessTrend


class WellnessService:
    """Service for managing wellness entries and calculations"""

    @staticmethod
    def create_entry(entry_data: WellnessEntryCreate) -> Optional[WellnessEntry]:
        """Create a new wellness entry with calculated score"""
        with get_session() as session:
            # Check if entry for this user and date already exists
            existing = session.exec(
                select(WellnessEntry).where(
                    WellnessEntry.user_id == entry_data.user_id, WellnessEntry.entry_date == entry_data.entry_date
                )
            ).first()

            if existing:
                return None  # Entry already exists for this date

            # Create new entry
            entry = WellnessEntry(
                user_id=entry_data.user_id,
                entry_date=entry_data.entry_date,
                sleep_hours=entry_data.sleep_hours,
                stress_level=entry_data.stress_level,
                caffeine_intake=entry_data.caffeine_intake,
                alcohol_intake=entry_data.alcohol_intake,
                wellness_score=Decimal("0"),  # Placeholder, will be calculated
            )

            # Calculate wellness score
            entry.wellness_score = entry.calculate_wellness_score()

            session.add(entry)
            session.commit()
            session.refresh(entry)
            return entry

    @staticmethod
    def update_entry(entry_id: int, entry_data: WellnessEntryUpdate) -> Optional[WellnessEntry]:
        """Update an existing wellness entry and recalculate score"""
        with get_session() as session:
            entry = session.get(WellnessEntry, entry_id)
            if entry is None:
                return None

            # Update fields that were provided
            if entry_data.sleep_hours is not None:
                entry.sleep_hours = entry_data.sleep_hours
            if entry_data.stress_level is not None:
                entry.stress_level = entry_data.stress_level
            if entry_data.caffeine_intake is not None:
                entry.caffeine_intake = entry_data.caffeine_intake
            if entry_data.alcohol_intake is not None:
                entry.alcohol_intake = entry_data.alcohol_intake

            # Recalculate wellness score
            entry.wellness_score = entry.calculate_wellness_score()
            entry.updated_at = datetime.utcnow()

            session.add(entry)
            session.commit()
            session.refresh(entry)
            return entry

    @staticmethod
    def get_entry_by_date(user_id: int, entry_date: date) -> Optional[WellnessEntry]:
        """Get wellness entry for specific user and date"""
        with get_session() as session:
            return session.exec(
                select(WellnessEntry).where(WellnessEntry.user_id == user_id, WellnessEntry.entry_date == entry_date)
            ).first()

    @staticmethod
    def get_user_entries(user_id: int, limit: int = 30) -> List[WellnessEntry]:
        """Get recent wellness entries for a user, ordered by date descending"""
        with get_session() as session:
            return list(
                session.exec(
                    select(WellnessEntry)
                    .where(WellnessEntry.user_id == user_id)
                    .order_by(desc(WellnessEntry.entry_date))
                    .limit(limit)
                )
            )

    @staticmethod
    def get_wellness_trends(user_id: int, days: int = 30) -> List[WellnessTrend]:
        """Get wellness trend data for the specified number of days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        with get_session() as session:
            entries = session.exec(
                select(WellnessEntry)
                .where(
                    WellnessEntry.user_id == user_id,
                    WellnessEntry.entry_date >= start_date,
                    WellnessEntry.entry_date <= end_date,
                )
                .order_by(asc(WellnessEntry.entry_date))
            ).all()

            return [
                WellnessTrend(
                    entry_date=entry.entry_date,
                    wellness_score=entry.wellness_score,
                    sleep_hours=entry.sleep_hours,
                    stress_level=entry.stress_level,
                    caffeine_intake=entry.caffeine_intake,
                    alcohol_intake=entry.alcohol_intake,
                )
                for entry in entries
            ]

    @staticmethod
    def calculate_average_score(user_id: int, days: int = 7) -> Optional[Decimal]:
        """Calculate average wellness score over specified days"""
        trends = WellnessService.get_wellness_trends(user_id, days)
        if not trends:
            return None

        total_score = sum(trend.wellness_score for trend in trends)
        return total_score / Decimal(str(len(trends)))

    @staticmethod
    def get_wellness_insights(user_id: int) -> dict:
        """Get wellness insights including averages and recommendations"""
        recent_trends = WellnessService.get_wellness_trends(user_id, 7)
        if not recent_trends:
            return {
                "average_score": None,
                "average_sleep": None,
                "average_stress": None,
                "recommendations": ["Start tracking your wellness to see insights!"],
            }

        avg_score = sum(t.wellness_score for t in recent_trends) / Decimal(str(len(recent_trends)))
        avg_sleep = sum(t.sleep_hours for t in recent_trends) / Decimal(str(len(recent_trends)))
        avg_stress = sum(t.stress_level for t in recent_trends) / len(recent_trends)
        avg_caffeine = sum(t.caffeine_intake for t in recent_trends) / Decimal(str(len(recent_trends)))
        avg_alcohol = sum(t.alcohol_intake for t in recent_trends) / Decimal(str(len(recent_trends)))

        recommendations = []

        if avg_sleep < Decimal("7"):
            recommendations.append("💤 Try to get 7-9 hours of sleep for optimal wellness")
        elif avg_sleep > Decimal("9"):
            recommendations.append("💤 Consider if you might be oversleeping - 7-9 hours is ideal")

        if avg_stress > 7:
            recommendations.append("😰 Your stress levels are high - consider relaxation techniques")
        elif avg_stress > 5:
            recommendations.append("😌 Moderate stress detected - try stress management activities")

        if avg_caffeine > Decimal("4"):
            recommendations.append("☕ Consider reducing caffeine intake - 1-3 cups is optimal")
        elif avg_caffeine == Decimal("0"):
            recommendations.append("☕ A moderate amount of caffeine (1-2 cups) can be beneficial")

        if avg_alcohol > Decimal("1"):
            recommendations.append("🍷 Consider reducing alcohol intake for better wellness")
        elif avg_alcohol == Decimal("0"):
            recommendations.append("🍷 Great job maintaining low alcohol consumption!")

        if not recommendations:
            recommendations.append("🎉 Your wellness metrics look great! Keep it up!")

        return {
            "average_score": avg_score.quantize(Decimal("0.1")),
            "average_sleep": avg_sleep.quantize(Decimal("0.1")),
            "average_stress": round(avg_stress, 1),
            "recommendations": recommendations,
        }

    @staticmethod
    def delete_entry(entry_id: int) -> bool:
        """Delete a wellness entry"""
        with get_session() as session:
            entry = session.get(WellnessEntry, entry_id)
            if entry is None:
                return False

            session.delete(entry)
            session.commit()
            return True


class UserService:
    """Service for managing users"""

    @staticmethod
    def create_user(name: str, email: str) -> Optional[User]:
        """Create a new user"""
        with get_session() as session:
            # Check if user with email already exists
            existing = session.exec(select(User).where(User.email == email)).first()

            if existing:
                return None  # Email already exists

            user = User(name=name, email=email)
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        with get_session() as session:
            return session.exec(select(User).where(User.email == email)).first()

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        with get_session() as session:
            return session.get(User, user_id)

    @staticmethod
    def get_all_users() -> List[User]:
        """Get all active users"""
        with get_session() as session:
            return list(
                session.exec(
                    select(User).where(User.is_active == True)  # noqa: E712
                )
            )
