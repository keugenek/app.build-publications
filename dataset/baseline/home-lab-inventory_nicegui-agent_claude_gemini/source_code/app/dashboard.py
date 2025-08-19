from nicegui import ui
from app.services import DashboardService
import logging

logger = logging.getLogger(__name__)


def create_metric_card(title: str, value: str, subtitle: str = "", icon: str = "", color: str = "primary"):
    """Create a modern metric card component"""
    with ui.card().classes("p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-all duration-200"):
        with ui.row().classes("items-center justify-between w-full"):
            with ui.column().classes("gap-1"):
                ui.label(title).classes("text-sm text-gray-500 uppercase tracking-wider font-medium")
                ui.label(value).classes("text-3xl font-bold text-gray-800")
                if subtitle:
                    ui.label(subtitle).classes("text-sm text-gray-600")
            if icon:
                ui.icon(icon, size="2em").classes(f"text-{color}")


def create_type_breakdown_card(title: str, data: dict, icon: str = ""):
    """Create a breakdown card showing asset types"""
    with ui.card().classes("p-6 bg-white shadow-lg rounded-xl"):
        with ui.row().classes("items-center gap-3 mb-4"):
            if icon:
                ui.icon(icon, size="1.5em").classes("text-primary")
            ui.label(title).classes("text-lg font-semibold text-gray-800")

        if not data:
            ui.label("No data available").classes("text-gray-500 text-center py-4")
        else:
            with ui.column().classes("gap-2 w-full"):
                for asset_type, count in sorted(data.items()):
                    with ui.row().classes("items-center justify-between w-full"):
                        ui.label(asset_type.replace("_", " ").title()).classes("text-gray-700")
                        ui.badge(str(count)).classes("bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm")


@ui.refreshable
def dashboard_content():
    """Refreshable dashboard content"""
    try:
        stats = DashboardService.get_statistics()

        # Top metrics row
        with ui.row().classes("gap-6 w-full mb-6"):
            create_metric_card(
                "Hardware Assets",
                str(stats["hardware"]["total"]),
                f"{stats['hardware']['active']} active",
                "dns",
                "blue",
            )
            create_metric_card(
                "Software Assets",
                str(stats["software"]["total"]),
                f"{stats['software']['active']} active",
                "memory",
                "green",
            )
            create_metric_card(
                "IP Allocations",
                str(stats["ip_allocations"]["total"]),
                f"{stats['ip_allocations']['allocated']} assigned",
                "router",
                "purple",
            )
            create_metric_card(
                "Available IPs",
                str(stats["ip_allocations"]["available"]),
                f"{stats['ip_allocations']['active']} active",
                "public",
                "orange",
            )

        # Breakdown charts row
        with ui.row().classes("gap-6 w-full"):
            with ui.column().classes("flex-1"):
                create_type_breakdown_card("Hardware by Type", stats["hardware"]["by_type"], "dns")

            with ui.column().classes("flex-1"):
                create_type_breakdown_card("Software by Type", stats["software"]["by_type"], "memory")

    except Exception as e:
        logger.error(f"Error loading dashboard: {e}")
        ui.notify(f"Error loading dashboard: {str(e)}", type="negative")
        ui.label("Failed to load dashboard data").classes("text-red-500 text-center py-8")


def create():
    """Create dashboard module"""

    @ui.page("/dashboard")
    def dashboard():
        # Apply modern theme
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full min-h-screen bg-gray-50"):
            # Header
            with ui.card().classes("w-full mb-6 shadow-sm"):
                with ui.row().classes("items-center justify-between p-6"):
                    with ui.row().classes("items-center gap-4"):
                        ui.icon("dashboard", size="2em").classes("text-primary")
                        with ui.column().classes("gap-1"):
                            ui.label("Home Lab Infrastructure").classes("text-2xl font-bold text-gray-800")
                            ui.label("Overview and management dashboard").classes("text-gray-600")

                    ui.button("Refresh", icon="refresh", on_click=dashboard_content.refresh).classes(
                        "bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    )

            # Main content container
            with ui.column().classes("flex-1 p-6"):
                dashboard_content()

            # Footer
            with ui.row().classes("justify-center p-4 text-gray-500 text-sm"):
                ui.label("Home Lab Infrastructure Manager")


def create_quick_links():
    """Create quick navigation links for other modules"""

    @ui.page("/quick-links")
    def quick_links():
        with ui.column().classes("w-full max-w-4xl mx-auto p-6 gap-6"):
            ui.label("Quick Links").classes("text-2xl font-bold text-gray-800 mb-4")

            with ui.row().classes("gap-6 w-full"):
                # Hardware Assets
                with ui.card().classes("p-6 cursor-pointer hover:shadow-lg transition-shadow") as hardware_card:
                    with ui.column().classes("items-center gap-4"):
                        ui.icon("dns", size="3em").classes("text-blue-500")
                        ui.label("Hardware Assets").classes("text-lg font-semibold")
                        ui.label("Manage servers, switches, and other hardware").classes("text-gray-600 text-center")
                    hardware_card.on("click", lambda: ui.navigate.to("/hardware"))

                # Software Assets
                with ui.card().classes("p-6 cursor-pointer hover:shadow-lg transition-shadow") as software_card:
                    with ui.column().classes("items-center gap-4"):
                        ui.icon("memory", size="3em").classes("text-green-500")
                        ui.label("Software Assets").classes("text-lg font-semibold")
                        ui.label("Manage VMs, containers, and applications").classes("text-gray-600 text-center")
                    software_card.on("click", lambda: ui.navigate.to("/software"))

                # IP Allocations
                with ui.card().classes("p-6 cursor-pointer hover:shadow-lg transition-shadow") as ip_card:
                    with ui.column().classes("items-center gap-4"):
                        ui.icon("router", size="3em").classes("text-purple-500")
                        ui.label("IP Allocations").classes("text-lg font-semibold")
                        ui.label("Manage IP addresses and network configuration").classes("text-gray-600 text-center")
                    ip_card.on("click", lambda: ui.navigate.to("/ip-allocations"))
