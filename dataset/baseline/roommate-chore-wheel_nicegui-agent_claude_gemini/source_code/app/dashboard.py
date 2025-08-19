"""UI module for the main dashboard and weekly assignments."""

import logging
from nicegui import ui

from app.services import ScheduleService, MemberService, ChoreService
from app.models import ChoreStatus

logger = logging.getLogger(__name__)


def create():
    """Create the dashboard UI."""

    @ui.page("/")
    def dashboard_page():
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
            ui.label("Chore Management Dashboard").classes("text-4xl font-bold text-gray-800 mb-2")
            ui.label("Manage your household chores and weekly assignments").classes("text-lg text-gray-600 mb-6")

            # Quick stats cards (if data exists)
            quick_stats_container = ui.row().classes("gap-4 mb-8 w-full")

            def show_quick_stats():
                """Show quick statistics cards."""
                with quick_stats_container:
                    quick_stats_container.clear()

                    try:
                        members = MemberService.get_all_members(active_only=True)
                        chores = ChoreService.get_all_chores(active_only=True)
                        current_schedule = ScheduleService.get_current_week_schedule()

                        with ui.row().classes("gap-4 w-full"):
                            # Members card
                            with ui.card().classes("p-4 bg-blue-50 border-l-4 border-blue-500 min-w-48"):
                                with ui.row().classes("items-center gap-3"):
                                    ui.icon("people").classes("text-3xl text-blue-600")
                                    with ui.column().classes("gap-1"):
                                        ui.label(str(len(members))).classes("text-2xl font-bold text-gray-800")
                                        ui.label("Active Members").classes("text-sm text-gray-600")

                            # Chores card
                            with ui.card().classes("p-4 bg-green-50 border-l-4 border-green-500 min-w-48"):
                                with ui.row().classes("items-center gap-3"):
                                    ui.icon("cleaning_services").classes("text-3xl text-green-600")
                                    with ui.column().classes("gap-1"):
                                        ui.label(str(len(chores))).classes("text-2xl font-bold text-gray-800")
                                        ui.label("Active Chores").classes("text-sm text-gray-600")

                            # Current week completion card
                            if current_schedule:
                                stats = ScheduleService.get_schedule_stats(current_schedule)
                                completion_color = (
                                    "purple"
                                    if stats.completion_rate == 100
                                    else "yellow"
                                    if stats.completion_rate >= 50
                                    else "red"
                                )
                                with ui.card().classes(
                                    f"p-4 bg-{completion_color}-50 border-l-4 border-{completion_color}-500 min-w-48"
                                ):
                                    with ui.row().classes("items-center gap-3"):
                                        ui.icon("task_alt").classes(f"text-3xl text-{completion_color}-600")
                                        with ui.column().classes("gap-1"):
                                            ui.label(f"{stats.completion_rate:.0f}%").classes(
                                                "text-2xl font-bold text-gray-800"
                                            )
                                            ui.label("Completed").classes("text-sm text-gray-600")
                    except Exception as e:
                        logger.error(f"Error loading dashboard stats: {str(e)}")
                        # If there's an error, just show basic navigation
                        with ui.row().classes("gap-4"):
                            ui.button(
                                "Manage Members", on_click=lambda: ui.navigate.to("/members"), color="secondary"
                            ).props("outline")
                            ui.button(
                                "Manage Chores", on_click=lambda: ui.navigate.to("/chores"), color="secondary"
                            ).props("outline")
                            ui.button(
                                "View History", on_click=lambda: ui.navigate.to("/history"), color="secondary"
                            ).props("outline")

            show_quick_stats()

            # Current week section
            current_week_container = ui.column().classes("w-full gap-4")

            def refresh_current_week():
                """Refresh the current week assignments."""
                with current_week_container:
                    current_week_container.clear()

                    # Get or create current week schedule
                    current_schedule = ScheduleService.get_current_week_schedule()

                    if current_schedule is None:
                        # No current schedule - show create button
                        with ui.card().classes("p-8 text-center bg-blue-50 border-2 border-blue-200"):
                            ui.icon("calendar_today").classes("text-6xl text-blue-500 mb-4")
                            ui.label("No assignments for this week").classes("text-xl text-gray-800 mb-2")
                            ui.label("Create weekly assignments to get started").classes("text-gray-600 mb-6")

                            with ui.row().classes("gap-4 justify-center"):
                                ui.button(
                                    "Create This Week's Assignments",
                                    on_click=lambda: create_weekly_assignments(),
                                    color="primary",
                                ).classes("px-6 py-3")
                    else:
                        # Show current week assignments
                        show_current_week_assignments(current_schedule)

            def create_weekly_assignments():
                """Create assignments for the current week."""
                try:
                    # Check if we have members and chores
                    members = MemberService.get_all_members(active_only=True)
                    chores = ChoreService.get_all_chores(active_only=True)

                    if not members:
                        ui.notify("Please add some household members first", type="warning")
                        return

                    if not chores:
                        ui.notify("Please add some chores first", type="warning")
                        return

                    # Create schedule and assignments
                    schedule = ScheduleService.create_weekly_schedule()
                    assignments = ScheduleService.assign_chores_randomly(schedule)

                    ui.notify(f"Created {len(assignments)} assignments for this week!", type="positive")
                    refresh_current_week()

                except Exception as e:
                    logger.error(f"Error creating weekly assignments: {str(e)}")
                    ui.notify(f"Error creating assignments: {str(e)}", type="negative")

            def show_current_week_assignments(schedule):
                """Display the current week's assignments."""
                assignments = ScheduleService.get_schedule_assignments(schedule)
                stats = ScheduleService.get_schedule_stats(schedule)

                # Week header with stats
                with ui.card().classes("p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-6"):
                    with ui.row().classes("w-full justify-between items-center"):
                        with ui.column():
                            ui.label(f"Week of {schedule.week_start_date.strftime('%B %d, %Y')}").classes(
                                "text-2xl font-bold"
                            )
                            ui.label(
                                f"{schedule.week_start_date.strftime('%b %d')} - {schedule.week_end_date.strftime('%b %d, %Y')}"
                            ).classes("text-blue-100")

                        with ui.column().classes("text-right"):
                            ui.label(f"{stats.completion_rate:.1f}% Complete").classes("text-2xl font-bold")
                            ui.label(f"{stats.completed_assignments}/{stats.total_assignments} completed").classes(
                                "text-blue-100"
                            )

                    # Progress bar
                    if stats.total_assignments > 0:
                        with ui.row().classes("w-full mt-4"):
                            ui.linear_progress(value=stats.completion_rate / 100, color="white", size="6px").classes(
                                "w-full"
                            )

                # Action buttons
                with ui.row().classes("gap-4 mb-6"):
                    ui.button("Reassign All Chores", on_click=lambda: reassign_chores(schedule), color="warning").props(
                        "outline"
                    )
                    ui.button(
                        "Mark All Complete", on_click=lambda: mark_all_complete(schedule), color="positive"
                    ).props("outline")
                    ui.button("Refresh", on_click=refresh_current_week, color="secondary").props("outline")

                # Assignments grid
                if assignments:
                    with ui.row().classes("w-full gap-4 flex-wrap"):
                        for assignment in assignments:
                            create_assignment_card(assignment, refresh_current_week)
                else:
                    with ui.card().classes("p-6 text-center"):
                        ui.label("No assignments found").classes("text-gray-600")

            def create_assignment_card(assignment, refresh_callback):
                """Create a card for displaying assignment information."""
                # Determine card styling based on status
                if assignment.status == ChoreStatus.COMPLETED:
                    card_class = "p-4 shadow-md bg-green-50 border-l-4 border-green-500"
                    status_color = "positive"
                    status_icon = "check_circle"
                elif assignment.status == ChoreStatus.OVERDUE:
                    card_class = "p-4 shadow-md bg-red-50 border-l-4 border-red-500"
                    status_color = "negative"
                    status_icon = "warning"
                else:
                    card_class = "p-4 shadow-md bg-white border-l-4 border-blue-500"
                    status_color = "info"
                    status_icon = "schedule"

                with ui.card().classes(card_class + " min-w-80 max-w-96"):
                    # Chore name and status
                    with ui.row().classes("w-full justify-between items-center mb-3"):
                        ui.label(assignment.chore.name if assignment.chore else "Unknown Chore").classes(
                            "text-lg font-bold text-gray-800"
                        )
                        with ui.row().classes("items-center gap-1"):
                            ui.icon(status_icon).classes(f"text-{status_color}")
                            ui.badge(assignment.status.value.title(), color=status_color).classes("text-xs")

                    # Assigned member
                    with ui.row().classes("items-center gap-2 mb-3 text-gray-700"):
                        ui.icon("person").classes("text-sm")
                        ui.label(f"Assigned to: {assignment.member.name if assignment.member else 'Unknown'}").classes(
                            "font-medium"
                        )

                    # Chore details
                    if assignment.chore and assignment.chore.description:
                        ui.label(assignment.chore.description).classes("text-sm text-gray-600 mb-2")

                    if assignment.chore and assignment.chore.estimated_minutes:
                        with ui.row().classes("items-center gap-2 text-gray-500 text-sm mb-3"):
                            ui.icon("schedule").classes("text-sm")
                            ui.label(f"~{assignment.chore.estimated_minutes} minutes")

                    # Completion info
                    if assignment.completed_at:
                        ui.label(f"Completed: {assignment.completed_at.strftime('%b %d, %I:%M %p')}").classes(
                            "text-xs text-green-600"
                        )
                        if assignment.rating:
                            with ui.row().classes("items-center gap-1 mt-1"):
                                ui.label("Quality:").classes("text-xs text-gray-500")
                                for i in range(1, 6):
                                    ui.icon("star" if i <= assignment.rating else "star_border").classes(
                                        "text-yellow-400 text-sm" if i <= assignment.rating else "text-gray-300 text-sm"
                                    )

                    # Action buttons
                    with ui.row().classes("gap-2 mt-4"):
                        if assignment.status == ChoreStatus.PENDING:
                            ui.button(
                                "Mark Complete",
                                on_click=lambda a=assignment: mark_complete_dialog(a, refresh_callback),
                                color="positive",
                            ).props("dense").classes("px-4")
                        elif assignment.status == ChoreStatus.COMPLETED:
                            ui.button(
                                "Mark Pending",
                                on_click=lambda a=assignment: mark_pending(a, refresh_callback),
                                color="warning",
                            ).props("outline dense")

            async def mark_complete_dialog(assignment, refresh_callback):
                """Dialog for marking an assignment complete with optional rating."""
                with ui.dialog() as dialog, ui.card().classes("w-80 p-6"):
                    ui.label("Mark Assignment Complete").classes("text-xl font-bold mb-4")
                    ui.label(f"Chore: {assignment.chore.name if assignment.chore else 'Unknown'}").classes(
                        "text-gray-700 mb-2"
                    )
                    ui.label(f"Member: {assignment.member.name if assignment.member else 'Unknown'}").classes(
                        "text-gray-700 mb-4"
                    )

                    ui.label("Quality Rating (optional):").classes("text-sm font-medium mb-2")
                    rating_select = ui.select(
                        options={1: "1 - Poor", 2: "2 - Fair", 3: "3 - Good", 4: "4 - Very Good", 5: "5 - Excellent"},
                        value=3,
                        label="Select rating",
                    ).classes("w-full mb-4")

                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Mark Complete", on_click=lambda: dialog.submit(True), color="positive")

                result = await dialog
                if result:
                    try:
                        rating = int(rating_select.value) if rating_select.value else None
                        if assignment.id is not None:
                            ScheduleService.mark_assignment_completed(assignment.id, rating)
                            ui.notify("Assignment marked as complete!", type="positive")
                            refresh_callback()
                    except Exception as e:
                        logger.error(f"Error marking assignment {assignment.id} complete: {str(e)}")
                        ui.notify(f"Error marking complete: {str(e)}", type="negative")

            def mark_pending(assignment, refresh_callback):
                """Mark an assignment as pending."""
                try:
                    if assignment.id is not None:
                        ScheduleService.update_assignment_status(assignment.id, ChoreStatus.PENDING)
                        ui.notify("Assignment marked as pending", type="info")
                        refresh_callback()
                except Exception as e:
                    logger.error(f"Error marking assignment {assignment.id} pending: {str(e)}")
                    ui.notify(f"Error marking pending: {str(e)}", type="negative")

            def reassign_chores(schedule):
                """Reassign all chores randomly."""
                try:
                    assignments = ScheduleService.assign_chores_randomly(schedule)
                    ui.notify(f"Reassigned {len(assignments)} chores randomly!", type="positive")
                    refresh_current_week()
                except Exception as e:
                    logger.error(f"Error reassigning chores for schedule {schedule.id}: {str(e)}")
                    ui.notify(f"Error reassigning chores: {str(e)}", type="negative")

            async def mark_all_complete(schedule):
                """Mark all assignments as complete."""
                assignments = ScheduleService.get_schedule_assignments(schedule)
                pending_assignments = [a for a in assignments if a.status == ChoreStatus.PENDING]

                if not pending_assignments:
                    ui.notify("No pending assignments to complete", type="info")
                    return

                try:
                    for assignment in pending_assignments:
                        if assignment.id is not None:
                            ScheduleService.mark_assignment_completed(assignment.id)

                    ui.notify(f"Marked {len(pending_assignments)} assignments as complete!", type="positive")
                    refresh_current_week()
                except Exception as e:
                    logger.error(f"Error marking all assignments complete for schedule {schedule.id}: {str(e)}")
                    ui.notify(f"Error marking assignments complete: {str(e)}", type="negative")

            # Initial load
            refresh_current_week()
