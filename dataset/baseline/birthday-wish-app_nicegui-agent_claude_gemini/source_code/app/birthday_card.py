from nicegui import ui
import asyncio


class BirthdayCard:
    def __init__(self):
        self.birthday_person = "Friend"
        self.custom_message = "🎉 Happy Birthday! 🎉"
        self.photos = [
            # Using placeholder images for demo - can be replaced with actual photos
            "https://picsum.photos/300/300?random=1",
            "https://picsum.photos/300/300?random=2",
            "https://picsum.photos/300/300?random=3",
            "https://picsum.photos/300/300?random=4",
            "https://picsum.photos/300/300?random=5",
            "https://picsum.photos/300/300?random=6",
        ]
        self.confetti_active = False

    def create_confetti_animation(self) -> str:
        """Generate CSS animation for confetti effect"""
        return """
        <style>
        .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background: #f0f;
            animation: confetti-fall 3s linear infinite;
            z-index: 1000;
        }
        
        .confetti:nth-child(1) { left: 10%; animation-delay: 0s; background: #ff6b6b; }
        .confetti:nth-child(2) { left: 20%; animation-delay: 0.5s; background: #4ecdc4; }
        .confetti:nth-child(3) { left: 30%; animation-delay: 1s; background: #45b7d1; }
        .confetti:nth-child(4) { left: 40%; animation-delay: 1.5s; background: #96ceb4; }
        .confetti:nth-child(5) { left: 50%; animation-delay: 2s; background: #ffeaa7; }
        .confetti:nth-child(6) { left: 60%; animation-delay: 2.5s; background: #dda0dd; }
        .confetti:nth-child(7) { left: 70%; animation-delay: 0.25s; background: #98d8c8; }
        .confetti:nth-child(8) { left: 80%; animation-delay: 0.75s; background: #f7dc6f; }
        .confetti:nth-child(9) { left: 90%; animation-delay: 1.25s; background: #bb8fce; }
        .confetti:nth-child(10) { left: 15%; animation-delay: 1.75s; background: #85c1e9; }
        
        @keyframes confetti-fall {
            0% {
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        
        .balloon {
            position: fixed;
            bottom: -100px;
            animation: balloon-float 6s ease-in-out infinite;
            z-index: 999;
            font-size: 3rem;
        }
        
        .balloon:nth-child(1) { left: 5%; animation-delay: 0s; }
        .balloon:nth-child(2) { left: 15%; animation-delay: 1s; }
        .balloon:nth-child(3) { left: 25%; animation-delay: 2s; }
        .balloon:nth-child(4) { left: 75%; animation-delay: 0.5s; }
        .balloon:nth-child(5) { left: 85%; animation-delay: 1.5s; }
        .balloon:nth-child(6) { left: 95%; animation-delay: 2.5s; }
        
        @keyframes balloon-float {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .birthday-title {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            background-size: 400% 400%;
            animation: gradient-shift 4s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .photo-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .photo-card:hover {
            transform: scale(1.05) rotate(2deg);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .celebration-button {
            background: linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);
            background-size: 200% 200%;
            animation: button-glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes button-glow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        </style>
        """

    def create_photo_gallery(self) -> None:
        """Create an interactive photo gallery"""
        ui.label("📸 Memory Gallery 📸").classes("text-2xl font-bold text-center mb-6")

        with ui.row().classes("gap-4 justify-center flex-wrap max-w-4xl mx-auto"):
            for i, photo_url in enumerate(self.photos):
                with ui.card().classes("photo-card bg-white shadow-lg rounded-lg overflow-hidden"):
                    ui.image(photo_url).classes("w-48 h-48 object-cover")
                    ui.label(f"Memory #{i + 1}").classes("text-sm text-gray-600 p-2 text-center")

    async def trigger_celebration(self) -> None:
        """Trigger confetti and balloon animations"""
        self.confetti_active = True

        # Add confetti elements
        confetti_html = """
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        """

        balloon_html = """
        <div class="balloon">🎈</div>
        <div class="balloon">🎈</div>
        <div class="balloon">🎈</div>
        <div class="balloon">🎈</div>
        <div class="balloon">🎈</div>
        <div class="balloon">🎈</div>
        """

        ui.add_body_html(confetti_html + balloon_html)
        ui.notify("🎉 Celebration time! 🎉", type="positive")

        # Remove animations after 6 seconds
        await asyncio.sleep(6)
        ui.run_javascript("""
            document.querySelectorAll('.confetti, .balloon').forEach(el => el.remove());
        """)

    def create_personalized_message(self) -> None:
        """Create the main birthday message section"""
        with ui.column().classes("text-center mb-8"):
            ui.label("🎂 Happy Birthday! 🎂").classes("birthday-title text-6xl font-bold mb-4")

            ui.label(f"Dear {self.birthday_person},").classes("text-2xl text-gray-700 mb-4")

            ui.label(self.custom_message).classes("text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed")

            ui.label("May your day be filled with happiness and your year with joy!").classes(
                "text-lg text-gray-500 italic"
            )

    def create_celebration_controls(self) -> None:
        """Create interactive celebration controls"""
        with ui.row().classes("gap-4 justify-center mb-8"):
            ui.button("🎉 Start Celebration!", on_click=self.trigger_celebration).classes(
                "celebration-button text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg"
            )

            ui.button(
                "🎵 Play Happy Birthday", on_click=lambda: ui.notify("🎵 Happy Birthday song playing! 🎵", type="info")
            ).classes("bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-bold")

    def customize_message(self, name: str | None, message: str | None) -> None:
        """Allow customization of the birthday message"""
        self.birthday_person = name or "Friend"
        self.custom_message = message or "🎉 Happy Birthday! 🎉"


def create():
    """Create the birthday card module"""

    @ui.page("/")
    def birthday_card_page():
        # Apply modern theme
        ui.colors(
            primary="#ff6b6b",
            secondary="#4ecdc4",
            accent="#45b7d1",
            positive="#96ceb4",
            negative="#ff7675",
            warning="#fdcb6e",
            info="#74b9ff",
        )

        card = BirthdayCard()

        # Add CSS animations to head
        ui.add_head_html(card.create_confetti_animation())

        # Set background
        ui.add_head_html("""
            <style>
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                padding: 20px;
            }
            </style>
        """)

        # Main container
        with ui.column().classes("w-full max-w-6xl mx-auto"):
            # Header section with personalized message
            with ui.card().classes("w-full p-8 mb-6 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl"):
                card.create_personalized_message()

                # Customization section
                with ui.expansion("Customize Your Message", icon="edit").classes("w-full max-w-md mx-auto"):
                    with ui.column().classes("gap-4 p-4"):
                        name_input = ui.input("Birthday Person's Name", placeholder="Enter name").classes("w-full")
                        message_input = (
                            ui.textarea("Personal Message", placeholder="Enter your personal birthday message")
                            .classes("w-full")
                            .props("rows=3")
                        )

                        def update_message():
                            card.customize_message(name_input.value, message_input.value)
                            ui.notify("Message updated! Refresh to see changes.", type="positive")

                        ui.button("Update Message", on_click=update_message).classes(
                            "bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg"
                        )

            # Celebration controls
            with ui.card().classes("w-full p-6 mb-6 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl"):
                ui.label("🎪 Celebration Zone 🎪").classes("text-3xl font-bold text-center mb-4")
                card.create_celebration_controls()

            # Photo gallery
            with ui.card().classes("w-full p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl"):
                card.create_photo_gallery()

            # Footer message
            with ui.card().classes("w-full p-6 mt-6 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl"):
                with ui.column().classes("text-center"):
                    ui.label("🌟 Wishing you all the best! 🌟").classes("text-2xl font-bold text-gray-700 mb-2")
                    ui.label("From your friends with love ❤️").classes("text-lg text-gray-600")
