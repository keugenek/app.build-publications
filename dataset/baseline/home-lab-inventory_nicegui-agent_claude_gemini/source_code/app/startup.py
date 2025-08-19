from app.database import create_tables
from nicegui import ui
import app.dashboard
import app.hardware_assets
import app.software_assets
import app.ip_allocations


def startup() -> None:
    # this function is called before the first request
    create_tables()

    # Initialize all modules
    app.dashboard.create()
    app.hardware_assets.create()
    app.software_assets.create()
    app.ip_allocations.create()

    @ui.page("/")
    def index():
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

        with ui.column().classes("w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"):
            # Header
            with ui.card().classes("w-full mb-8 shadow-lg bg-white/80 backdrop-blur-sm"):
                with ui.column().classes("items-center p-8"):
                    ui.icon("home", size="4em").classes("text-primary mb-4")
                    ui.label("Home Lab Infrastructure Manager").classes("text-4xl font-bold text-gray-800 mb-2")
                    ui.label("Centralized management for your home lab assets and network").classes(
                        "text-xl text-gray-600"
                    )

            # Quick navigation cards
            with ui.row().classes("gap-8 justify-center max-w-6xl mx-auto px-6"):
                # Dashboard
                with ui.card().classes(
                    "p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/90"
                ) as dashboard_card:
                    with ui.column().classes("items-center gap-4 min-w-48"):
                        ui.icon("dashboard", size="3em").classes("text-blue-500")
                        ui.label("Dashboard").classes("text-xl font-semibold text-gray-800")
                        ui.label("Overview and statistics").classes("text-gray-600 text-center")
                    dashboard_card.on("click", lambda: ui.navigate.to("/dashboard"))

                # Hardware Assets
                with ui.card().classes(
                    "p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/90"
                ) as hardware_card:
                    with ui.column().classes("items-center gap-4 min-w-48"):
                        ui.icon("dns", size="3em").classes("text-green-500")
                        ui.label("Hardware").classes("text-xl font-semibold text-gray-800")
                        ui.label("Servers, switches, routers").classes("text-gray-600 text-center")
                    hardware_card.on("click", lambda: ui.navigate.to("/hardware"))

                # Software Assets
                with ui.card().classes(
                    "p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/90"
                ) as software_card:
                    with ui.column().classes("items-center gap-4 min-w-48"):
                        ui.icon("memory", size="3em").classes("text-purple-500")
                        ui.label("Software").classes("text-xl font-semibold text-gray-800")
                        ui.label("VMs, containers, services").classes("text-gray-600 text-center")
                    software_card.on("click", lambda: ui.navigate.to("/software"))

                # IP Allocations
                with ui.card().classes(
                    "p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/90"
                ) as ip_card:
                    with ui.column().classes("items-center gap-4 min-w-48"):
                        ui.icon("router", size="3em").classes("text-orange-500")
                        ui.label("IP Management").classes("text-xl font-semibold text-gray-800")
                        ui.label("Network configuration").classes("text-gray-600 text-center")
                    ip_card.on("click", lambda: ui.navigate.to("/ip-allocations"))

            # Features section
            with ui.card().classes("max-w-4xl mx-auto mt-12 p-8 bg-white/80 backdrop-blur-sm shadow-lg"):
                ui.label("Features").classes("text-2xl font-bold text-gray-800 mb-6 text-center")

                with ui.row().classes("gap-8 justify-center"):
                    with ui.column().classes("items-center gap-2 flex-1"):
                        ui.icon("inventory", size="2em").classes("text-blue-500")
                        ui.label("Asset Tracking").classes("font-semibold text-gray-800")
                        ui.label("Track hardware and software assets with detailed information").classes(
                            "text-sm text-gray-600 text-center"
                        )

                    with ui.column().classes("items-center gap-2 flex-1"):
                        ui.icon("network_check", size="2em").classes("text-green-500")
                        ui.label("IP Management").classes("font-semibold text-gray-800")
                        ui.label("Manage IP allocations and network configurations").classes(
                            "text-sm text-gray-600 text-center"
                        )

                    with ui.column().classes("items-center gap-2 flex-1"):
                        ui.icon("analytics", size="2em").classes("text-purple-500")
                        ui.label("Dashboard").classes("font-semibold text-gray-800")
                        ui.label("Visual overview of your entire infrastructure").classes(
                            "text-sm text-gray-600 text-center"
                        )

            # Footer
            with ui.row().classes("justify-center mt-8 p-4 text-gray-500 text-sm"):
                ui.label("Home Lab Infrastructure Manager - Built with NiceGUI")
