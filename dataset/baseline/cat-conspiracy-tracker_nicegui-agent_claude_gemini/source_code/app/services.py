"""Service layer for cat surveillance operations"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlmodel import select, desc

from app.database import get_session
from app.models import (
    Cat,
    CatCreate,
    CatUpdate,
    SuspiciousActivity,
    SuspiciousActivityCreate,
    ActivityLog,
    ActivityLogCreate,
    DailyConspiracyLevel,
    ConspiracyLevelSummary,
)


class CatService:
    """Service for managing cat subjects under surveillance"""

    @staticmethod
    def create_cat(cat_data: CatCreate) -> Cat:
        """Register a new cat for surveillance"""
        with get_session() as session:
            cat = Cat(**cat_data.model_dump())
            session.add(cat)
            session.commit()
            session.refresh(cat)
            return cat

    @staticmethod
    def get_cat(cat_id: int) -> Optional[Cat]:
        """Retrieve cat subject by ID"""
        with get_session() as session:
            return session.get(Cat, cat_id)

    @staticmethod
    def get_all_cats() -> List[Cat]:
        """Get all cats under surveillance"""
        with get_session() as session:
            statement = select(Cat).order_by(Cat.name)
            return list(session.exec(statement))

    @staticmethod
    def update_cat(cat_id: int, cat_data: CatUpdate) -> Optional[Cat]:
        """Update cat information"""
        with get_session() as session:
            cat = session.get(Cat, cat_id)
            if cat is None:
                return None

            update_data = cat_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(cat, key, value)

            session.add(cat)
            session.commit()
            session.refresh(cat)
            return cat

    @staticmethod
    def delete_cat(cat_id: int) -> bool:
        """Remove cat from surveillance (and all related logs)"""
        with get_session() as session:
            cat = session.get(Cat, cat_id)
            if cat is None:
                return False

            session.delete(cat)
            session.commit()
            return True


class SuspiciousActivityService:
    """Service for managing types of suspicious activities"""

    @staticmethod
    def create_activity(activity_data: SuspiciousActivityCreate) -> SuspiciousActivity:
        """Define a new type of suspicious behavior"""
        with get_session() as session:
            activity = SuspiciousActivity(**activity_data.model_dump())
            session.add(activity)
            session.commit()
            session.refresh(activity)
            return activity

    @staticmethod
    def get_activity(activity_id: int) -> Optional[SuspiciousActivity]:
        """Get suspicious activity type by ID"""
        with get_session() as session:
            return session.get(SuspiciousActivity, activity_id)

    @staticmethod
    def get_all_activities() -> List[SuspiciousActivity]:
        """Get all defined suspicious activities"""
        with get_session() as session:
            statement = select(SuspiciousActivity).order_by(SuspiciousActivity.name)
            return list(session.exec(statement))

    @staticmethod
    def get_activities_by_points() -> List[SuspiciousActivity]:
        """Get activities sorted by conspiracy points (most suspicious first)"""
        with get_session() as session:
            statement = select(SuspiciousActivity).order_by(desc(SuspiciousActivity.conspiracy_points))
            return list(session.exec(statement))


class ActivityLogService:
    """Service for logging and tracking suspicious cat activities"""

    @staticmethod
    def log_activity(log_data: ActivityLogCreate) -> ActivityLog:
        """Record a suspicious activity incident"""
        with get_session() as session:
            log = ActivityLog(**log_data.model_dump())
            session.add(log)
            session.commit()
            session.refresh(log)
            return log

    @staticmethod
    def get_logs_for_cat_today(cat_id: int) -> List[ActivityLog]:
        """Get today's activity logs for a specific cat"""
        today = date.today()
        with get_session() as session:
            statement = (
                select(ActivityLog)
                .where(ActivityLog.cat_id == cat_id)
                .where(ActivityLog.logged_date == today)
                .order_by(desc(ActivityLog.logged_at))
            )
            return list(session.exec(statement))

    @staticmethod
    def get_logs_for_date(log_date: date) -> List[ActivityLog]:
        """Get all activity logs for a specific date"""
        with get_session() as session:
            statement = (
                select(ActivityLog).where(ActivityLog.logged_date == log_date).order_by(desc(ActivityLog.logged_at))
            )
            return list(session.exec(statement))

    @staticmethod
    def delete_log(log_id: int) -> bool:
        """Remove a logged activity (false alarm)"""
        with get_session() as session:
            log = session.get(ActivityLog, log_id)
            if log is None:
                return False

            session.delete(log)
            session.commit()
            return True


class ConspiracyService:
    """Service for calculating and interpreting conspiracy levels"""

    @staticmethod
    def calculate_daily_conspiracy_level(cat_id: int, target_date: date) -> Optional[DailyConspiracyLevel]:
        """Calculate conspiracy level for a specific cat on a specific date"""
        with get_session() as session:
            cat = session.get(Cat, cat_id)
            if cat is None:
                return None

            # Get all logs for this cat on this date with activity details
            statement = (
                select(ActivityLog, SuspiciousActivity)
                .join(SuspiciousActivity)
                .where(ActivityLog.cat_id == cat_id)
                .where(ActivityLog.logged_date == target_date)
            )
            results = list(session.exec(statement))

            if not results:
                return DailyConspiracyLevel(
                    cat_id=cat_id,
                    cat_name=cat.name,
                    date=target_date,
                    total_points=Decimal("0"),
                    activity_count=0,
                    conspiracy_level="Suspiciously Quiet",
                    level_description=f"{cat.name} is being too well-behaved. This is highly suspicious.",
                )

            # Calculate total conspiracy points
            total_points = Decimal("0")
            for log, activity in results:
                # Multiply activity base points by intensity
                total_points += activity.conspiracy_points * Decimal(str(log.intensity))

            activity_count = len(results)
            level, description = ConspiracyService._interpret_conspiracy_level(cat.name, total_points, activity_count)

            return DailyConspiracyLevel(
                cat_id=cat_id,
                cat_name=cat.name,
                date=target_date,
                total_points=total_points,
                activity_count=activity_count,
                conspiracy_level=level,
                level_description=description,
            )

    @staticmethod
    def calculate_today_summary() -> ConspiracyLevelSummary:
        """Calculate overall conspiracy summary for today"""
        today = date.today()
        cats = CatService.get_all_cats()

        cat_levels = []
        total_activities = 0
        max_points = Decimal("0")
        most_suspicious_cat = None

        for cat in cats:
            if cat.id is not None:
                level = ConspiracyService.calculate_daily_conspiracy_level(cat.id, today)
                if level:
                    cat_levels.append(level)
                    total_activities += level.activity_count

                    if level.total_points > max_points:
                        max_points = level.total_points
                        most_suspicious_cat = level.cat_name

        # Determine overall threat level
        if max_points >= Decimal("30"):
            threat_level = "🚨 DEFCON 1 - MAXIMUM FELINE CONSPIRACY ALERT"
        elif max_points >= Decimal("20"):
            threat_level = "🔴 High Alert - Enhanced Surveillance Required"
        elif max_points >= Decimal("10"):
            threat_level = "🟡 Moderate Suspicion - Keep Eyes Open"
        elif max_points > Decimal("0"):
            threat_level = "🟢 Low-Level Plotting Detected"
        else:
            threat_level = "😴 Suspiciously Quiet - Too Calm"

        return ConspiracyLevelSummary(
            date=today,
            cats=cat_levels,
            overall_threat_level=threat_level,
            total_activities=total_activities,
            most_suspicious_cat=most_suspicious_cat,
        )

    @staticmethod
    def _interpret_conspiracy_level(cat_name: str, points: Decimal, activity_count: int) -> tuple[str, str]:
        """Interpret conspiracy points into humorous level and description"""
        if points >= Decimal("30"):
            return (
                "🚨 MAXIMUM ALERT",
                f"{cat_name} is clearly plotting world domination. Consider hiding your valuables and sleeping with one eye open.",
            )
        elif points >= Decimal("20"):
            return (
                "🔴 Highly Suspicious",
                f"{cat_name} is definitely up to something big. The evidence is overwhelming.",
            )
        elif points >= Decimal("15"):
            return ("🟠 Major Plotting", f"{cat_name} is orchestrating a significant scheme. Stay vigilant.")
        elif points >= Decimal("10"):
            return (
                "🟡 Moderate Conspiracy",
                f"{cat_name} is engaged in moderate levels of suspicious activity. Standard monitoring protocols apply.",
            )
        elif points >= Decimal("5"):
            return (
                "🔵 Minor Scheming",
                f"{cat_name} is up to some light plotting. Nothing out of the ordinary for a cat.",
            )
        elif points > Decimal("0"):
            return (
                "🟢 Baseline Suspicion",
                f"{cat_name} is displaying normal cat suspicious behavior. All is as expected.",
            )
        else:
            return (
                "😴 Suspiciously Quiet",
                f"{cat_name} is being unusually well-behaved. This level of innocence is highly suspicious.",
            )


def seed_suspicious_activities():
    """Initialize database with predefined suspicious activities"""
    activities_data = [
        {
            "name": "Prolonged Staring",
            "description": "Making intense eye contact for extended periods, clearly planning something",
            "conspiracy_points": Decimal("2.0"),
            "icon": "👁️",
        },
        {
            "name": "Knocking Items Off Shelves",
            "description": "Systematically testing gravity and your patience simultaneously",
            "conspiracy_points": Decimal("3.0"),
            "icon": "📚",
        },
        {
            "name": "Bringing Dead Insects as Gifts",
            "description": "Delivering threatening messages via deceased arthropod intermediaries",
            "conspiracy_points": Decimal("4.0"),
            "icon": "🦗",
        },
        {
            "name": "Mysterious House Sprinting",
            "description": "Sudden high-speed dashes through the house at 3 AM for no apparent reason",
            "conspiracy_points": Decimal("2.5"),
            "icon": "💨",
        },
        {
            "name": "Hiding in Cardboard Boxes",
            "description": "Establishing covert surveillance posts in Amazon delivery containers",
            "conspiracy_points": Decimal("1.5"),
            "icon": "📦",
        },
        {
            "name": "Aggressive Purring",
            "description": "Using weaponized contentment to lower your guard",
            "conspiracy_points": Decimal("1.0"),
            "icon": "😸",
        },
        {
            "name": "Ignoring When Called",
            "description": "Demonstrating clear insubordination and rejection of human authority",
            "conspiracy_points": Decimal("2.0"),
            "icon": "🙉",
        },
        {
            "name": "Sitting on Important Documents",
            "description": "Interfering with human administrative operations through strategic positioning",
            "conspiracy_points": Decimal("3.5"),
            "icon": "📄",
        },
        {
            "name": "Meowing at Nothing",
            "description": "Communicating with invisible entities or interdimensional conspirators",
            "conspiracy_points": Decimal("5.0"),
            "icon": "👻",
        },
        {
            "name": "Surveillance from High Places",
            "description": "Establishing elevated observation posts to monitor human activities",
            "conspiracy_points": Decimal("2.0"),
            "icon": "🏔️",
        },
    ]

    with get_session() as session:
        # Check if activities already exist
        existing = session.exec(select(SuspiciousActivity)).first()
        if existing is not None:
            return  # Already seeded

        for activity_data in activities_data:
            activity = SuspiciousActivity(**activity_data)
            session.add(activity)

        session.commit()
