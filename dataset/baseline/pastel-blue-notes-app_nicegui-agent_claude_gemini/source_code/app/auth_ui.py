from nicegui import ui, app
from app.auth_service import AuthService
from app.models import UserCreate, UserLogin
from app.theme import ThemeStyles


def create():
    """Create authentication UI pages"""

    @ui.page("/login")
    def login_page():
        ui.add_head_html("<title>Notes App - Login</title>")

        with ui.column().classes(
            "min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6 items-center justify-center"
        ):
            with ui.card().classes("w-96 p-8 shadow-xl rounded-xl bg-white"):
                # Header
                ui.label("Welcome Back").classes("text-3xl font-bold text-blue-800 text-center mb-2")
                ui.label("Sign in to your notes").classes("text-blue-600 text-center mb-8")

                # Error message container
                error_container = ui.row().classes("w-full mb-4")

                # Login form
                with ui.column().classes("w-full gap-4"):
                    email_input = ui.input("Email", placeholder="your@email.com").classes(ThemeStyles.INPUT)
                    password_input = ui.input("Password", password=True, placeholder="Your password").classes(
                        ThemeStyles.INPUT
                    )

                    async def handle_login():
                        error_container.clear()

                        if not email_input.value or not password_input.value:
                            with error_container:
                                ui.label("Please fill in all fields").classes("text-red-500 text-sm")
                            return

                        try:
                            login_data = UserLogin(email=email_input.value, password=password_input.value)
                            user = AuthService.authenticate_user(login_data)

                            if user is None:
                                with error_container:
                                    ui.label("Invalid email or password").classes("text-red-500 text-sm")
                                return

                            # Store user in session
                            app.storage.user["user_id"] = user.id
                            app.storage.user["email"] = user.email

                            ui.notify("Login successful!", type="positive")
                            ui.navigate.to("/dashboard")

                        except Exception:
                            with error_container:
                                ui.label("Login failed. Please try again.").classes("text-red-500 text-sm")

                    ui.button("Sign In", on_click=handle_login).classes(ThemeStyles.PRIMARY_BUTTON + " w-full")

                    # Keyboard shortcuts
                    ui.keyboard(on_key=lambda e: handle_login() if e.key == "Enter" else None)

                # Divider
                ui.separator().classes("my-6")

                # Register link
                with ui.row().classes("w-full justify-center"):
                    ui.label("Don't have an account?").classes("text-gray-600")
                    ui.link("Sign up", "/register").classes("text-blue-600 font-medium ml-1")

    @ui.page("/register")
    def register_page():
        ui.add_head_html("<title>Notes App - Register</title>")

        with ui.column().classes(
            "min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6 items-center justify-center"
        ):
            with ui.card().classes("w-96 p-8 shadow-xl rounded-xl bg-white"):
                # Header
                ui.label("Create Account").classes("text-3xl font-bold text-blue-800 text-center mb-2")
                ui.label("Join to start organizing your notes").classes("text-blue-600 text-center mb-8")

                # Error/success message container
                message_container = ui.row().classes("w-full mb-4")

                # Register form
                with ui.column().classes("w-full gap-4"):
                    email_input = ui.input("Email", placeholder="your@email.com").classes(ThemeStyles.INPUT)
                    password_input = ui.input(
                        "Password", password=True, placeholder="Choose a strong password"
                    ).classes(ThemeStyles.INPUT)
                    confirm_password_input = ui.input(
                        "Confirm Password", password=True, placeholder="Confirm your password"
                    ).classes(ThemeStyles.INPUT)

                    async def handle_register():
                        message_container.clear()

                        if not email_input.value or not password_input.value or not confirm_password_input.value:
                            with message_container:
                                ui.label("Please fill in all fields").classes("text-red-500 text-sm")
                            return

                        if password_input.value != confirm_password_input.value:
                            with message_container:
                                ui.label("Passwords do not match").classes("text-red-500 text-sm")
                            return

                        if len(password_input.value) < 8:
                            with message_container:
                                ui.label("Password must be at least 8 characters").classes("text-red-500 text-sm")
                            return

                        try:
                            user_data = UserCreate(email=email_input.value, password=password_input.value)
                            user = AuthService.create_user(user_data)

                            if user is None:
                                with message_container:
                                    ui.label("Email already exists").classes("text-red-500 text-sm")
                                return

                            with message_container:
                                ui.label("Account created successfully! Please login.").classes(
                                    "text-green-600 text-sm"
                                )

                            # Clear form
                            email_input.value = ""
                            password_input.value = ""
                            confirm_password_input.value = ""

                        except Exception:
                            with message_container:
                                ui.label("Registration failed. Please try again.").classes("text-red-500 text-sm")

                    ui.button("Create Account", on_click=handle_register).classes(
                        ThemeStyles.PRIMARY_BUTTON + " w-full"
                    )

                    # Keyboard shortcuts
                    ui.keyboard(on_key=lambda e: handle_register() if e.key == "Enter" else None)

                # Divider
                ui.separator().classes("my-6")

                # Login link
                with ui.row().classes("w-full justify-center"):
                    ui.label("Already have an account?").classes("text-gray-600")
                    ui.link("Sign in", "/login").classes("text-blue-600 font-medium ml-1")


def require_auth():
    """Check if user is authenticated, redirect to login if not"""
    user_id = app.storage.user.get("user_id")
    if not user_id:
        ui.navigate.to("/login")
        return None
    return user_id


def logout_user():
    """Log out the current user"""
    app.storage.user.clear()
    ui.notify("Logged out successfully", type="info")
    ui.navigate.to("/login")
