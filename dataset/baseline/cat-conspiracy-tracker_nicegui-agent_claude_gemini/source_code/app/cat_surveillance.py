"""Cat surveillance UI - For the paranoid cat owner"""

from datetime import date
from decimal import Decimal

from nicegui import ui

from app.services import (
    CatService,
    SuspiciousActivityService,
    ActivityLogService,
    ConspiracyService,
    seed_suspicious_activities,
)
from app.models import CatCreate, ActivityLogCreate


def create():
    """Create the cat surveillance application UI"""

    # Seed activities on startup
    seed_suspicious_activities()

    # Apply quirky theme
    ui.colors(
        primary="#7c3aed",  # Purple for mystery
        secondary="#f97316",  # Orange for alert
        accent="#10b981",  # Green for normal
        positive="#10b981",
        negative="#ef4444",  # Red for maximum alert
        warning="#f59e0b",  # Amber for suspicious
        info="#3b82f6",
    )

    @ui.page("/")
    def index():
        """Main surveillance dashboard"""

        ui.add_head_html("""
        <style>
        .surveillance-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .conspiracy-card {
            border-left: 5px solid #7c3aed;
            background: rgba(124, 58, 237, 0.05);
        }
        .activity-button {
            transition: all 0.2s ease;
            background: white;
            border: 2px solid #e5e7eb;
        }
        .activity-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-color: #7c3aed;
        }
        .threat-level {
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        </style>
        """)

        # Header
        with ui.row().classes("w-full surveillance-header p-6 items-center gap-4"):
            ui.icon("visibility", size="2em")
            ui.label("🐱 CAT SURVEILLANCE HQ 🐱").classes("text-3xl font-bold")
            ui.label("Monitoring Feline Conspiracies Since Today").classes("text-lg opacity-90")

        # Get summary data
        summary = ConspiracyService.calculate_today_summary()

        # Threat Level Display
        with ui.card().classes("w-full p-6 conspiracy-card mb-6"):
            with ui.row().classes("items-center gap-4 mb-4"):
                ui.icon("warning", size="2em", color="orange")
                ui.label("CURRENT THREAT LEVEL").classes("text-2xl font-bold")

            ui.label(summary.overall_threat_level).classes("text-xl threat-level font-bold mb-2")

            with ui.row().classes("gap-6"):
                ui.label(f"📊 Total Activities Today: {summary.total_activities}").classes("text-lg")
                if summary.most_suspicious_cat:
                    ui.label(f"🏆 Most Suspicious: {summary.most_suspicious_cat}").classes("text-lg")

        # Cat Status Grid
        cats = CatService.get_all_cats()

        if not cats:
            with ui.card().classes("w-full p-8 text-center"):
                ui.icon("pets", size="3em", color="grey")
                ui.label("No cats registered for surveillance").classes("text-xl text-gray-600 mt-4")
                ui.button("Register First Cat", on_click=lambda: ui.navigate.to("/register-cat")).classes(
                    "mt-4 bg-primary text-white px-6 py-3"
                )
        else:
            ui.label("🐾 Current Subjects Under Surveillance").classes("text-2xl font-bold mb-4")

            with ui.grid(columns=min(len(cats), 3)).classes("w-full gap-4 mb-6"):
                for cat in cats:
                    create_cat_status_card(cat)

        # Quick Actions
        with ui.row().classes("gap-4 w-full justify-center"):
            ui.button("📝 Log Suspicious Activity", on_click=lambda: ui.navigate.to("/log-activity")).classes(
                "bg-warning text-white px-6 py-3 text-lg font-bold"
            )

            ui.button("📊 View Detailed Reports", on_click=lambda: ui.navigate.to("/reports")).classes(
                "bg-info text-white px-6 py-3 text-lg"
            )

            ui.button("🐱 Manage Cats", on_click=lambda: ui.navigate.to("/manage-cats")).classes(
                "bg-secondary text-white px-6 py-3 text-lg"
            )

    def create_cat_status_card(cat):
        """Create a status card for a single cat"""
        if cat.id is None:
            return

        level = ConspiracyService.calculate_daily_conspiracy_level(cat.id, date.today())
        if level is None:
            return

        # Determine card color based on threat level
        if level.total_points >= Decimal("20"):
            card_color = "border-red-500 bg-red-50"
            icon_color = "red"
        elif level.total_points >= Decimal("10"):
            card_color = "border-orange-500 bg-orange-50"
            icon_color = "orange"
        elif level.total_points > Decimal("0"):
            card_color = "border-yellow-500 bg-yellow-50"
            icon_color = "amber"
        else:
            card_color = "border-blue-500 bg-blue-50"
            icon_color = "blue"

        with ui.card().classes(f"p-4 {card_color} border-l-4"):
            with ui.row().classes("items-center gap-2 mb-2"):
                ui.icon("pets", color=icon_color)
                ui.label(cat.name).classes("text-xl font-bold")

            ui.label(level.conspiracy_level).classes("text-lg font-semibold mb-2")
            ui.label(f"Points: {level.total_points} | Activities: {level.activity_count}").classes(
                "text-sm text-gray-600"
            )
            ui.label(level.level_description).classes("text-sm italic mt-2")

            ui.button("📋 Quick Log", on_click=lambda cat_id=cat.id: ui.navigate.to(f"/quick-log/{cat_id}")).classes(
                "mt-3 bg-primary text-white px-4 py-2 w-full"
            )

    @ui.page("/log-activity")
    def log_activity_page():
        """Activity logging interface"""

        ui.page_title("Log Suspicious Activity")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/")).props("flat")
            ui.label("📝 Log Suspicious Activity").classes("text-3xl font-bold")

        cats = CatService.get_all_cats()
        activities = SuspiciousActivityService.get_all_activities()

        if not cats:
            with ui.card().classes("w-full p-8 text-center"):
                ui.label("No cats registered for surveillance").classes("text-xl")
                ui.button("Register Cat", on_click=lambda: ui.navigate.to("/register-cat")).classes("mt-4")
            return

        with ui.card().classes("w-full max-w-2xl mx-auto p-6"):
            ui.label("Report Suspicious Behavior").classes("text-2xl font-bold mb-6")

            # Cat selection
            ui.label("Subject Cat:").classes("text-lg font-medium mb-2")
            cat_select = ui.select(
                {cat.id: f"{cat.name} ({cat.breed or 'Unknown breed'})" for cat in cats if cat.id}, label="Select cat"
            ).classes("w-full mb-4")

            # Activity selection with visual buttons
            ui.label("Suspicious Activity:").classes("text-lg font-medium mb-2")
            selected_activity = {"value": None}  # Use dict to avoid state binding issues
            activity_buttons = []

            with ui.grid(columns=2).classes("gap-4 mb-6"):
                for activity in activities:

                    def create_activity_button(act):
                        def select_activity():
                            selected_activity["value"] = act.id
                            # Update button states
                            for btn in activity_buttons:
                                if btn._props.get("activity_id") == act.id:
                                    btn.classes(add="ring-2 ring-primary bg-primary text-white")
                                else:
                                    btn.classes(remove="ring-2 ring-primary bg-primary text-white")

                        btn = ui.button(on_click=select_activity).classes(
                            "activity-button p-4 h-24 flex-col text-center"
                        )
                        btn._props["activity_id"] = act.id

                        with btn:
                            ui.label(act.icon or "🐱").classes("text-2xl mb-1")
                            ui.label(act.name).classes("font-semibold text-sm")
                            ui.label(f"{act.conspiracy_points} pts").classes("text-xs text-gray-600")

                        return btn

                    activity_buttons.append(create_activity_button(activity))

            # Intensity slider
            ui.label("Intensity Level (1-5):").classes("text-lg font-medium mb-2")
            intensity_slider = ui.slider(min=1, max=5, value=3, step=1).classes("w-full mb-4")
            ui.label().bind_text_from(intensity_slider, "value", lambda v: f"Level {int(v)}: {'⭐' * int(v)}")

            # Notes
            ui.label("Additional Notes:").classes("text-lg font-medium mb-2")
            notes_input = ui.textarea(placeholder="Describe the suspicious behavior in detail...").classes(
                "w-full mb-6"
            )

            # Submit button
            def submit_log():
                if not cat_select.value:
                    ui.notify("Please select a cat", type="negative")
                    return

                if not selected_activity["value"]:
                    ui.notify("Please select an activity", type="negative")
                    return

                try:
                    log_data = ActivityLogCreate(
                        cat_id=cat_select.value,
                        activity_id=selected_activity["value"],
                        intensity=int(intensity_slider.value),
                        notes=notes_input.value or None,
                    )

                    ActivityLogService.log_activity(log_data)
                    ui.notify("Suspicious activity logged successfully! 🚨", type="positive")
                    ui.navigate.to("/")

                except Exception as e:
                    import logging

                    logging.error(f"Error logging activity: {str(e)}")
                    ui.notify(f"Error logging activity: {str(e)}", type="negative")

            ui.button("🚨 Log Activity", on_click=submit_log).classes(
                "bg-warning text-white px-8 py-3 text-lg font-bold w-full"
            )

    @ui.page("/quick-log/{cat_id}")
    def quick_log_page(cat_id: int):
        """Quick logging interface for a specific cat"""

        cat = CatService.get_cat(cat_id)
        if cat is None:
            ui.label("Cat not found").classes("text-xl text-red-500")
            return

        ui.page_title(f"Quick Log - {cat.name}")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/")).props("flat")
            ui.label(f"🎯 Quick Log for {cat.name}").classes("text-3xl font-bold")

        activities = SuspiciousActivityService.get_activities_by_points()

        with ui.card().classes("w-full max-w-4xl mx-auto p-6"):
            ui.label("What suspicious activity did you observe?").classes("text-xl font-semibold mb-6")

            with ui.grid(columns=3).classes("gap-4"):
                for activity in activities:

                    def create_quick_button(act):
                        def quick_log():
                            try:
                                log_data = ActivityLogCreate(
                                    cat_id=cat_id,
                                    activity_id=act.id,
                                    intensity=3,  # Default intensity
                                )

                                ActivityLogService.log_activity(log_data)
                                ui.notify(f"{act.name} logged for {cat.name}! 📝", type="positive")
                                ui.navigate.to("/")

                            except Exception as e:
                                import logging

                                logging.error(f"Error in quick log: {str(e)}")
                                ui.notify(f"Error: {str(e)}", type="negative")

                        with (
                            ui.card()
                            .classes("p-6 hover:shadow-lg cursor-pointer text-center activity-button")
                            .on("click", quick_log)
                        ):
                            ui.label(act.icon or "🐱").classes("text-4xl mb-3")
                            ui.label(act.name).classes("font-bold text-lg mb-2")
                            ui.label(act.description).classes("text-sm text-gray-600 mb-3")
                            ui.label(f"⚠️ {act.conspiracy_points} Points").classes("font-semibold text-primary")

                    create_quick_button(activity)

    @ui.page("/register-cat")
    def register_cat_page():
        """Cat registration interface"""

        ui.page_title("Register New Cat for Surveillance")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/")).props("flat")
            ui.label("🐱 Register New Surveillance Subject").classes("text-3xl font-bold")

        with ui.card().classes("w-full max-w-lg mx-auto p-6"):
            ui.label("Cat Registration Form").classes("text-2xl font-bold mb-6")

            name_input = ui.input(label="Cat Name *").classes("w-full mb-4")
            breed_input = ui.input(label="Breed (optional)").classes("w-full mb-4")
            color_input = ui.input(label="Color (optional)").classes("w-full mb-4")
            age_input = ui.number(label="Age in months (optional)", min=0).classes("w-full mb-4")
            description_input = ui.textarea(
                label="Description (optional)",
                placeholder="Any notable characteristics or previous suspicious behavior...",
            ).classes("w-full mb-6")

            def register_cat():
                if not name_input.value:
                    ui.notify("Cat name is required", type="negative")
                    return

                try:
                    cat_data = CatCreate(
                        name=name_input.value,
                        breed=breed_input.value or None,
                        color=color_input.value or None,
                        age_months=int(age_input.value) if age_input.value else None,
                        description=description_input.value or None,
                    )

                    cat = CatService.create_cat(cat_data)
                    ui.notify(f"{cat.name} has been registered for surveillance! 🐾", type="positive")
                    ui.navigate.to("/")

                except Exception as e:
                    import logging

                    logging.error(f"Error registering cat: {str(e)}")
                    ui.notify(f"Error registering cat: {str(e)}", type="negative")

            ui.button("📝 Register Cat", on_click=register_cat).classes(
                "bg-primary text-white px-8 py-3 text-lg font-bold w-full"
            )

    @ui.page("/manage-cats")
    def manage_cats_page():
        """Cat management interface"""

        ui.page_title("Manage Surveillance Subjects")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/")).props("flat")
            ui.label("🐱 Manage Surveillance Subjects").classes("text-3xl font-bold")

        cats = CatService.get_all_cats()

        with ui.row().classes("gap-4 mb-6"):
            ui.button("+ Register New Cat", on_click=lambda: ui.navigate.to("/register-cat")).classes(
                "bg-primary text-white px-6 py-3"
            )

        if not cats:
            with ui.card().classes("w-full p-8 text-center"):
                ui.label("No cats registered yet").classes("text-xl")
            return

        with ui.column().classes("w-full gap-4"):
            for cat in cats:
                with ui.card().classes("p-4 w-full"):
                    with ui.row().classes("items-center justify-between"):
                        with ui.column():
                            ui.label(cat.name).classes("text-xl font-bold")
                            if cat.breed:
                                ui.label(f"Breed: {cat.breed}").classes("text-gray-600")
                            if cat.color:
                                ui.label(f"Color: {cat.color}").classes("text-gray-600")
                            if cat.age_months:
                                ui.label(f"Age: {cat.age_months} months").classes("text-gray-600")
                            if cat.description:
                                ui.label(f"Notes: {cat.description}").classes("text-sm text-gray-500 mt-2")

                        with ui.row().classes("gap-2"):
                            ui.button(
                                "📊 View Stats", on_click=lambda cat_id=cat.id: ui.navigate.to(f"/cat-stats/{cat_id}")
                            ).classes("bg-info text-white")

                            def delete_cat_handler(cat_id=cat.id, cat_name=cat.name):
                                async def confirm_delete():
                                    with ui.dialog() as dialog, ui.card():
                                        ui.label(f"Delete {cat_name}?").classes("text-lg font-bold mb-4")
                                        ui.label("This will remove all surveillance logs for this cat.").classes(
                                            "text-gray-600 mb-4"
                                        )
                                        with ui.row():
                                            ui.button("Yes, Delete", on_click=lambda: dialog.submit("yes")).classes(
                                                "bg-negative text-white"
                                            )
                                            ui.button("Cancel", on_click=lambda: dialog.submit("no"))

                                    result = await dialog
                                    if result == "yes":
                                        try:
                                            if cat_id is not None:
                                                CatService.delete_cat(cat_id)
                                                ui.notify(f"{cat_name} removed from surveillance", type="warning")
                                                ui.navigate.reload()
                                        except Exception as e:
                                            import logging

                                            logging.error(f"Error deleting cat: {str(e)}")
                                            ui.notify(f"Error: {str(e)}", type="negative")

                                import asyncio

                                asyncio.create_task(confirm_delete())

                            ui.button("🗑️", on_click=delete_cat_handler).classes("bg-negative text-white")

    @ui.page("/reports")
    def reports_page():
        """Detailed reports and statistics"""

        ui.page_title("Surveillance Reports")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/")).props("flat")
            ui.label("📊 Surveillance Reports & Analytics").classes("text-3xl font-bold")

        summary = ConspiracyService.calculate_today_summary()

        # Today's Summary
        with ui.card().classes("w-full p-6 mb-6"):
            ui.label("Today's Conspiracy Summary").classes("text-2xl font-bold mb-4")

            with ui.row().classes("gap-8"):
                with ui.column():
                    ui.label("🚨 Threat Level").classes("font-semibold mb-2")
                    ui.label(summary.overall_threat_level).classes("text-lg threat-level")

                with ui.column():
                    ui.label("📈 Statistics").classes("font-semibold mb-2")
                    ui.label(f"Total Activities: {summary.total_activities}")
                    ui.label(f"Cats Under Watch: {len(summary.cats)}")
                    if summary.most_suspicious_cat:
                        ui.label(f"Top Threat: {summary.most_suspicious_cat}").classes("text-warning font-bold")

        # Individual Cat Reports
        if summary.cats:
            ui.label("Individual Cat Reports").classes("text-2xl font-bold mb-4")

            with ui.column().classes("w-full gap-4"):
                for cat_level in summary.cats:
                    with ui.card().classes("p-4"):
                        with ui.row().classes("items-center justify-between mb-4"):
                            ui.label(f"🐱 {cat_level.cat_name}").classes("text-xl font-bold")
                            ui.label(cat_level.conspiracy_level).classes("text-lg font-semibold")

                        with ui.row().classes("gap-8 mb-4"):
                            ui.label(f"Points: {cat_level.total_points}").classes("text-lg")
                            ui.label(f"Activities: {cat_level.activity_count}").classes("text-lg")

                        ui.label(cat_level.level_description).classes("text-gray-600 italic")

                        # Today's activities for this cat
                        if cat_level.activity_count > 0:
                            logs = ActivityLogService.get_logs_for_cat_today(cat_level.cat_id)

                            ui.label("Today's Recorded Activities:").classes("font-semibold mt-4 mb-2")

                            for log in logs:
                                activity = SuspiciousActivityService.get_activity(log.activity_id)
                                if activity:
                                    time_str = log.logged_at.strftime("%H:%M")
                                    with ui.row().classes("items-center gap-2 mb-2"):
                                        ui.label(activity.icon or "🐱")
                                        ui.label(f"{time_str} - {activity.name}").classes("font-medium")
                                        ui.label(f"(Intensity: {log.intensity})").classes("text-sm text-gray-500")
                                        if log.notes:
                                            ui.label(f"- {log.notes}").classes("text-sm italic text-gray-600")

        # Activity Statistics
        activities = SuspiciousActivityService.get_all_activities()
        if activities:
            ui.label("Activity Database").classes("text-2xl font-bold mb-4 mt-8")

            with ui.card().classes("w-full p-6"):
                ui.label("Known Suspicious Behaviors").classes("text-lg font-bold mb-4")

                # Create activity table
                activity_rows = []
                for activity in activities:
                    activity_rows.append(
                        {
                            "icon": activity.icon or "🐱",
                            "name": activity.name,
                            "points": float(activity.conspiracy_points),
                            "description": activity.description[:50] + "..."
                            if len(activity.description) > 50
                            else activity.description,
                        }
                    )

                ui.table(
                    columns=[
                        {"name": "icon", "label": "", "field": "icon", "align": "center"},
                        {"name": "name", "label": "Activity", "field": "name", "align": "left"},
                        {"name": "points", "label": "Points", "field": "points", "align": "center"},
                        {"name": "description", "label": "Description", "field": "description", "align": "left"},
                    ],
                    rows=activity_rows,
                ).classes("w-full")

    @ui.page("/cat-stats/{cat_id}")
    def cat_stats_page(cat_id: int):
        """Individual cat statistics page"""

        cat = CatService.get_cat(cat_id)
        if cat is None:
            ui.label("Cat not found").classes("text-xl text-red-500")
            return

        ui.page_title(f"Stats - {cat.name}")

        # Header
        with ui.row().classes("items-center gap-4 mb-6"):
            ui.button("← Back", on_click=lambda: ui.navigate.to("/manage-cats")).props("flat")
            ui.label(f"📊 {cat.name} - Detailed Statistics").classes("text-3xl font-bold")

        # Cat Profile
        with ui.card().classes("w-full p-6 mb-6"):
            ui.label("Subject Profile").classes("text-xl font-bold mb-4")

            with ui.row().classes("gap-8"):
                with ui.column():
                    ui.label(f"Name: {cat.name}").classes("text-lg")
                    if cat.breed:
                        ui.label(f"Breed: {cat.breed}").classes("text-lg")
                    if cat.color:
                        ui.label(f"Color: {cat.color}").classes("text-lg")
                    if cat.age_months:
                        years = cat.age_months // 12
                        months = cat.age_months % 12
                        age_str = f"{years}y {months}m" if years > 0 else f"{months}m"
                        ui.label(f"Age: {age_str}").classes("text-lg")

                with ui.column():
                    ui.label(f"Under surveillance since: {cat.created_at.strftime('%Y-%m-%d')}").classes("text-lg")
                    if cat.description:
                        ui.label(f"Notes: {cat.description}").classes("text-lg")

        # Today's Level
        level = ConspiracyService.calculate_daily_conspiracy_level(cat_id, date.today())
        if level:
            with ui.card().classes("w-full p-6 mb-6"):
                ui.label("Current Threat Assessment").classes("text-xl font-bold mb-4")

                with ui.row().classes("items-center gap-6"):
                    ui.label(level.conspiracy_level).classes("text-2xl font-bold")
                    ui.label(f"{level.total_points} points").classes("text-lg")
                    ui.label(f"{level.activity_count} activities").classes("text-lg")

                ui.label(level.level_description).classes("text-gray-600 italic mt-4")

        # Recent Activities
        logs = ActivityLogService.get_logs_for_cat_today(cat_id)
        if logs:
            with ui.card().classes("w-full p-6"):
                ui.label("Today's Suspicious Activities").classes("text-xl font-bold mb-4")

                for log in logs:
                    activity = SuspiciousActivityService.get_activity(log.activity_id)
                    if activity:
                        time_str = log.logged_at.strftime("%H:%M:%S")
                        with ui.card().classes("p-3 mb-3"):
                            with ui.row().classes("items-center gap-4"):
                                ui.label(activity.icon or "🐱").classes("text-2xl")
                                with ui.column():
                                    ui.label(f"{activity.name}").classes("font-bold")
                                    ui.label(f"Logged at {time_str}").classes("text-sm text-gray-500")
                                    ui.label(f"Intensity: {log.intensity}/5").classes("text-sm")
                                    if log.notes:
                                        ui.label(f"Notes: {log.notes}").classes("text-sm italic")
                                ui.label(f"{activity.conspiracy_points * Decimal(str(log.intensity))} pts").classes(
                                    "font-bold text-primary"
                                )
        else:
            with ui.card().classes("w-full p-6"):
                ui.label("No suspicious activities recorded today").classes("text-lg text-center text-gray-500")
                ui.label("This level of good behavior is highly suspicious...").classes(
                    "text-sm text-center text-gray-400 italic mt-2"
                )
