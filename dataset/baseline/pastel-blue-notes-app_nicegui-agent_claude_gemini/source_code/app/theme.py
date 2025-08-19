from nicegui import ui


def apply_pastel_blue_theme():
    """Apply pastel blue color scheme to the application"""
    ui.colors(
        primary="#81C8E6",  # Soft pastel blue
        secondary="#B8E2F2",  # Lighter pastel blue
        accent="#4A90C2",  # Deeper blue for accents
        positive="#81E6C8",  # Soft mint for success
        negative="#E68A8A",  # Soft coral for errors
        warning="#E6C881",  # Soft yellow for warnings
        info="#9BB5E6",  # Soft lavender blue for info
    )


class ThemeStyles:
    """Consistent styling classes for the notes application"""

    # Layout styles
    CONTAINER = "max-w-6xl mx-auto p-6"
    SIDEBAR = "w-80 min-h-screen bg-blue-50 p-4 border-r border-blue-100"
    MAIN_CONTENT = "flex-1 p-6 bg-white min-h-screen"

    # Card styles
    CARD = "p-6 bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow"
    NOTE_CARD = (
        "p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 cursor-pointer transition-colors"
    )
    CATEGORY_CARD = "p-3 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow"

    # Typography styles
    HEADING = "text-2xl font-bold text-blue-800 mb-6"
    SUBHEADING = "text-lg font-semibold text-blue-700 mb-4"
    BODY = "text-base text-gray-700 leading-relaxed"
    CAPTION = "text-sm text-gray-500"

    # Button styles
    PRIMARY_BUTTON = "bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
    SECONDARY_BUTTON = "bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
    OUTLINE_BUTTON = "border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"

    # Form styles
    INPUT = "w-full p-3 border border-blue-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    TEXTAREA = "w-full p-3 border border-blue-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"

    # Navigation styles
    NAV_ITEM = "w-full text-left px-3 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
    ACTIVE_NAV_ITEM = "w-full text-left px-3 py-2 bg-blue-200 text-blue-800 rounded-lg font-medium"

    # Status styles
    PINNED = "text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs"
    CATEGORY_TAG = "px-2 py-1 rounded-full text-xs font-medium"
