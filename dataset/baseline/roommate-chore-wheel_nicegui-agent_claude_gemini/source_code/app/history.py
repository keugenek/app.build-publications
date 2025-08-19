"""UI module for viewing assignment history and analytics."""

import logging
from nicegui import ui
from datetime import date, timedelta

from app.services import ScheduleService, MemberService
from app.models import WeeklySchedule, AssignmentStats

logger = logging.getLogger(__name__)


def create():
    """Create the history and analytics UI."""

    @ui.page("/history")
    def history_page():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        # Navigation bar
        with ui.header().classes("bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"):
            with ui.row().classes("w-full max-w-7xl mx-auto px-6 py-3 justify-between items-center"):
                ui.label("🏠 ChoreManager").classes("text-2xl font-bold")
                with ui.row().classes("gap-4"):
                    ui.link("Dashboard", "/").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("Members", "/members").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("Chores", "/chores").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("History", "/history").classes("text-white hover:text-blue-200 font-medium")

        with ui.column().classes("w-full max-w-7xl mx-auto p-6 gap-6"):
            # Header
            ui.label("Assignment History & Analytics").classes("text-3xl font-bold text-gray-800 mb-2")
            ui.label("Track performance and view past assignments").classes("text-lg text-gray-600 mb-6")

            # Navigation
            with ui.row().classes("gap-4 mb-6"):
                ui.button("← Back to Dashboard", on_click=lambda: ui.navigate.to("/"), color="secondary").props(
                    "outline"
                )

            # Member stats section
            stats_container = ui.column().classes("w-full gap-4")

            def refresh_stats():
                """Refresh member statistics."""
                with stats_container:
                    stats_container.clear()

                    members = MemberService.get_all_members(active_only=True)

                    if not members:
                        with ui.card().classes("p-8 text-center"):
                            ui.icon("people").classes("text-6xl text-gray-400 mb-4")
                            ui.label("No active members found").classes("text-xl text-gray-600")
                        return

                    # Header for stats
                    ui.label("Member Performance (Last 4 Weeks)").classes("text-2xl font-bold text-gray-800 mb-4")

                    # Stats cards
                    with ui.row().classes("w-full gap-4 flex-wrap mb-8"):
                        for member in members:
                            if member.id is not None:
                                try:
                                    stats = ScheduleService.get_member_assignment_stats(member.id)
                                    create_member_stats_card(stats)
                                except Exception as e:
                                    logger.error(
                                        f"Error loading stats for member {member.id} ({member.name}): {str(e)}"
                                    )
                                    ui.notify(f"Error loading stats for {member.name}: {str(e)}", type="warning")

            def create_member_stats_card(stats: AssignmentStats):
                """Create a stats card for a member."""
                with ui.card().classes("p-6 shadow-lg min-w-80 max-w-96"):
                    # Member name
                    ui.label(stats.member_name).classes("text-xl font-bold text-gray-800 mb-4")

                    # Key metrics
                    with ui.column().classes("gap-3"):
                        # Total assignments
                        with ui.row().classes("justify-between items-center"):
                            ui.label("Total Assignments:").classes("text-gray-600")
                            ui.label(str(stats.total_assignments)).classes("font-bold text-2xl text-blue-600")

                        # Completion rate
                        with ui.row().classes("justify-between items-center"):
                            ui.label("Completion Rate:").classes("text-gray-600")
                            completion_color = (
                                "text-green-600"
                                if stats.completion_rate >= 80
                                else "text-yellow-600"
                                if stats.completion_rate >= 60
                                else "text-red-600"
                            )
                            ui.label(f"{stats.completion_rate:.1f}%").classes(f"font-bold text-xl {completion_color}")

                        # Progress bar for completion rate
                        ui.linear_progress(
                            value=stats.completion_rate / 100,
                            color="positive"
                            if stats.completion_rate >= 80
                            else "warning"
                            if stats.completion_rate >= 60
                            else "negative",
                            size="6px",
                        ).classes("w-full")

                        # Completed vs total
                        with ui.row().classes("justify-between items-center text-sm text-gray-500"):
                            ui.label(f"Completed: {stats.completed_assignments}")
                            ui.label(f"Pending: {stats.total_assignments - stats.completed_assignments}")

                        # Average rating
                        if stats.average_rating is not None:
                            with ui.row().classes("justify-between items-center"):
                                ui.label("Average Rating:").classes("text-gray-600")
                                with ui.row().classes("items-center gap-1"):
                                    rating = round(stats.average_rating, 1)
                                    ui.label(f"{rating}/5").classes("font-bold text-lg text-yellow-600")
                                    for i in range(1, 6):
                                        ui.icon("star" if i <= rating else "star_border").classes(
                                            "text-yellow-400" if i <= rating else "text-gray-300"
                                        )

                        # Total time estimate
                        if stats.total_estimated_minutes > 0:
                            hours = stats.total_estimated_minutes // 60
                            minutes = stats.total_estimated_minutes % 60
                            time_text = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

                            with ui.row().classes("justify-between items-center"):
                                ui.label("Estimated Time:").classes("text-gray-600")
                                ui.label(time_text).classes("font-bold text-purple-600")

            # Recent weeks section
            recent_weeks_container = ui.column().classes("w-full gap-4 mt-8")

            def refresh_recent_weeks():
                """Show recent weeks' schedules."""
                with recent_weeks_container:
                    recent_weeks_container.clear()

                    ui.label("Recent Weeks").classes("text-2xl font-bold text-gray-800 mb-4")

                    # Get past few weeks
                    weeks_to_show = []
                    current_date = date.today()

                    for i in range(8):  # Show last 8 weeks
                        week_date = current_date - timedelta(weeks=i)
                        week_start = ScheduleService.get_week_start_date(week_date)

                        # Try to find schedule for this week
                        from app.database import get_session
                        from sqlmodel import select

                        with get_session() as session:
                            schedule = session.exec(
                                select(WeeklySchedule).where(WeeklySchedule.week_start_date == week_start)
                            ).first()

                            if schedule:
                                weeks_to_show.append(schedule)

                    if not weeks_to_show:
                        with ui.card().classes("p-8 text-center"):
                            ui.icon("history").classes("text-6xl text-gray-400 mb-4")
                            ui.label("No historical data found").classes("text-xl text-gray-600")
                        return

                    # Show week cards
                    with ui.column().classes("w-full gap-4"):
                        for schedule in weeks_to_show:
                            create_week_history_card(schedule)

            def create_week_history_card(schedule: WeeklySchedule):
                """Create a card showing a week's assignment history."""
                stats = ScheduleService.get_schedule_stats(schedule)
                assignments = ScheduleService.get_schedule_assignments(schedule)

                with ui.card().classes("p-6 shadow-md"):
                    # Week header
                    with ui.row().classes("w-full justify-between items-center mb-4"):
                        with ui.column():
                            ui.label(f"Week of {schedule.week_start_date.strftime('%B %d, %Y')}").classes(
                                "text-lg font-bold text-gray-800"
                            )
                            ui.label(
                                f"{schedule.week_start_date.strftime('%b %d')} - {schedule.week_end_date.strftime('%b %d, %Y')}"
                            ).classes("text-gray-600")

                        # Completion badge
                        if stats.completion_rate == 100:
                            ui.badge("Complete", color="positive").classes("text-sm")
                        elif stats.completion_rate >= 80:
                            ui.badge(f"{stats.completion_rate:.0f}%", color="warning").classes("text-sm")
                        else:
                            ui.badge(f"{stats.completion_rate:.0f}%", color="negative").classes("text-sm")

                    # Stats summary
                    with ui.row().classes("gap-6 mb-4 text-sm"):
                        ui.label(f"Total: {stats.total_assignments}").classes("text-gray-600")
                        ui.label(f"Completed: {stats.completed_assignments}").classes("text-green-600")
                        if stats.pending_assignments > 0:
                            ui.label(f"Pending: {stats.pending_assignments}").classes("text-yellow-600")
                        if stats.overdue_assignments > 0:
                            ui.label(f"Overdue: {stats.overdue_assignments}").classes("text-red-600")

                    # Progress bar
                    if stats.total_assignments > 0:
                        ui.linear_progress(
                            value=stats.completion_rate / 100,
                            color="positive"
                            if stats.completion_rate == 100
                            else "warning"
                            if stats.completion_rate >= 80
                            else "negative",
                            size="4px",
                        ).classes("w-full mb-4")

                    # Assignment details (collapsed by default)
                    with ui.expansion("View Details", icon="expand_more").classes("w-full"):
                        if assignments:
                            with ui.column().classes("gap-2 pt-4"):
                                for assignment in assignments:
                                    with ui.row().classes("w-full justify-between items-center p-2 bg-gray-50 rounded"):
                                        with ui.column().classes("flex-1"):
                                            ui.label(assignment.chore.name if assignment.chore else "Unknown").classes(
                                                "font-medium"
                                            )
                                            ui.label(
                                                assignment.member.name if assignment.member else "Unknown"
                                            ).classes("text-sm text-gray-600")

                                        # Status badge
                                        status_colors = {
                                            "completed": "positive",
                                            "pending": "info",
                                            "overdue": "negative",
                                        }
                                        ui.badge(
                                            assignment.status.value.title(),
                                            color=status_colors.get(assignment.status.value, "secondary"),
                                        ).classes("text-xs")
                        else:
                            ui.label("No assignments found").classes("text-gray-500 text-center py-4")

            # Initial load
            refresh_stats()
            refresh_recent_weeks()
