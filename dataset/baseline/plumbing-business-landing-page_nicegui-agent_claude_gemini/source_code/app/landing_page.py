"""Professional plumbing business landing page"""

from nicegui import ui
from app.services import ServiceService, TestimonialService, ContactLeadService
from app.models import ContactLeadCreate
import re


def create():
    """Create the landing page module"""

    def apply_modern_theme():
        """Apply modern professional color theme"""
        ui.colors(
            primary="#1e40af",  # Professional blue
            secondary="#64748b",  # Subtle gray
            accent="#059669",  # Success green
            positive="#059669",
            negative="#dc2626",  # Error red
            warning="#d97706",  # Warning amber
            info="#2563eb",  # Info blue
        )

    def is_valid_email(email: str) -> bool:
        """Validate email format"""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    def is_valid_phone(phone: str) -> bool:
        """Validate phone format (basic validation)"""
        # Remove common separators
        cleaned = re.sub(r"[^\d]", "", phone)
        # Check for 10-11 digit US phone numbers
        return len(cleaned) >= 10 and len(cleaned) <= 11

    def create_hero_section():
        """Create the hero section with call-to-action"""
        with ui.element("section").classes("bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20"):
            with ui.column().classes("max-w-6xl mx-auto px-6 text-center"):
                ui.label("Professional Plumbing Services").classes("text-5xl font-bold mb-6")
                ui.label("Reliable • Fast • Licensed & Insured").classes("text-xl mb-8 opacity-90")
                ui.label("24/7 Emergency Service Available").classes(
                    "text-lg mb-10 bg-red-600 px-6 py-2 rounded-full inline-block"
                )

                with ui.row().classes("gap-4 justify-center"):
                    ui.button("Get Free Quote", on_click=lambda: scroll_to_contact()).classes(
                        "bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-bold rounded-lg shadow-lg"
                    )
                    ui.button("Call (555) 123-PIPE", on_click=lambda: ui.navigate.to("tel:5551237473")).classes(
                        "bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-800 px-8 py-4 text-lg font-bold rounded-lg"
                    )

    def create_services_section():
        """Create the services offered section"""
        with ui.element("section").classes("py-16 bg-gray-50"):
            with ui.column().classes("max-w-6xl mx-auto px-6"):
                ui.label("Our Plumbing Services").classes("text-4xl font-bold text-center mb-4 text-gray-800")
                ui.label("Professional solutions for all your plumbing needs").classes(
                    "text-xl text-center text-gray-600 mb-12"
                )

                services = ServiceService.get_all_services(active_only=True)

                with ui.element("div").classes("grid md:grid-cols-2 lg:grid-cols-3 gap-8"):
                    for service in services:
                        with ui.card().classes(
                            "p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-xl"
                        ):
                            # Service icon based on type
                            icon_map = {
                                "Emergency Leak": "🚨",
                                "Water Heater": "🔥",
                                "Drain Cleaning": "🔧",
                                "Pipe": "🔩",
                                "Bathroom": "🚿",
                                "Sewer": "🏠",
                            }

                            service_icon = "🔧"  # Default icon
                            for key, icon in icon_map.items():
                                if key.lower() in service.title.lower():
                                    service_icon = icon
                                    break

                            ui.label(service_icon).classes("text-4xl mb-4 text-center")
                            ui.label(service.title).classes("text-xl font-bold text-gray-800 mb-3 text-center")
                            ui.label(service.description).classes("text-gray-600 mb-4 text-center leading-relaxed")

                            if service.price_range_min is not None and service.price_range_max is not None:
                                ui.label(f"Starting from ${service.price_range_min}").classes(
                                    "text-primary font-semibold text-center"
                                )

    def create_testimonials_section():
        """Create the customer testimonials section"""
        with ui.element("section").classes("py-16 bg-white"):
            with ui.column().classes("max-w-6xl mx-auto px-6"):
                ui.label("What Our Customers Say").classes("text-4xl font-bold text-center mb-4 text-gray-800")
                ui.label("Don't just take our word for it").classes("text-xl text-center text-gray-600 mb-12")

                testimonials = TestimonialService.get_featured_testimonials()

                if testimonials:
                    with ui.element("div").classes("grid md:grid-cols-2 gap-8"):
                        for testimonial in testimonials:
                            with ui.card().classes("p-6 shadow-lg bg-gray-50 rounded-xl"):
                                # Star rating
                                stars = "⭐" * testimonial.rating
                                ui.label(stars).classes("text-2xl mb-3")

                                ui.label(f'"{testimonial.testimonial_text}"').classes(
                                    "text-gray-700 mb-4 italic leading-relaxed"
                                )

                                with ui.row().classes("items-center gap-3"):
                                    with ui.element("div").classes(
                                        "w-10 h-10 bg-primary rounded-full flex items-center justify-center"
                                    ):
                                        ui.label(testimonial.customer_name[0].upper()).classes(
                                            "text-white font-bold text-lg"
                                        )
                                    with ui.column().classes("gap-0"):
                                        ui.label(testimonial.customer_name).classes("font-bold text-gray-800")
                                        ui.label(testimonial.customer_location).classes("text-sm text-gray-500")
                                        if testimonial.service_type:
                                            ui.label(testimonial.service_type).classes("text-xs text-primary")

    def create_why_choose_us_section():
        """Create why choose us section"""
        with ui.element("section").classes("py-16 bg-blue-50"):
            with ui.column().classes("max-w-6xl mx-auto px-6"):
                ui.label("Why Choose Our Plumbing Services?").classes(
                    "text-4xl font-bold text-center mb-12 text-gray-800"
                )

                features = [
                    {
                        "icon": "🏆",
                        "title": "Licensed & Insured",
                        "description": "Fully licensed professionals with comprehensive insurance coverage",
                    },
                    {
                        "icon": "⚡",
                        "title": "24/7 Emergency Service",
                        "description": "Round-the-clock availability for plumbing emergencies",
                    },
                    {
                        "icon": "💯",
                        "title": "Quality Guarantee",
                        "description": "100% satisfaction guarantee on all our plumbing work",
                    },
                    {
                        "icon": "💰",
                        "title": "Transparent Pricing",
                        "description": "Upfront pricing with no hidden fees or surprises",
                    },
                    {
                        "icon": "⏰",
                        "title": "Fast Response Time",
                        "description": "Quick response times to minimize damage and inconvenience",
                    },
                    {
                        "icon": "🔧",
                        "title": "Expert Technicians",
                        "description": "Highly trained and experienced plumbing professionals",
                    },
                ]

                with ui.element("div").classes("grid md:grid-cols-2 lg:grid-cols-3 gap-8"):
                    for feature in features:
                        with ui.card().classes("p-6 text-center shadow-md bg-white rounded-lg"):
                            ui.label(feature["icon"]).classes("text-4xl mb-4")
                            ui.label(feature["title"]).classes("text-xl font-bold text-gray-800 mb-3")
                            ui.label(feature["description"]).classes("text-gray-600 leading-relaxed")

    def create_contact_form():
        """Create the contact form for lead generation"""
        with ui.element("section").classes("py-16 bg-gray-800 text-white").mark("contact-section"):
            with ui.column().classes("max-w-4xl mx-auto px-6"):
                ui.label("Get Your Free Quote Today").classes("text-4xl font-bold text-center mb-4")
                ui.label("Fill out the form below and we'll contact you within 24 hours").classes(
                    "text-xl text-center mb-12 opacity-90"
                )

                with ui.card().classes("p-8 bg-white text-gray-800 rounded-xl shadow-xl"):
                    # Form inputs
                    name_input = ui.input("Full Name").classes("w-full mb-4").props("outlined")
                    email_input = ui.input("Email Address").classes("w-full mb-4").props("outlined")
                    phone_input = ui.input("Phone Number").classes("w-full mb-4").props("outlined")

                    # Service selection
                    services = ServiceService.get_all_services(active_only=True)
                    service_options = ["General Inquiry"] + [service.title for service in services]
                    service_select = (
                        ui.select(label="Service Interest", options=service_options, value="General Inquiry")
                        .classes("w-full mb-4")
                        .props("outlined")
                    )

                    # Contact method preference
                    contact_method = (
                        ui.select(label="Preferred Contact Method", options=["Email", "Phone", "Text"], value="Phone")
                        .classes("w-full mb-4")
                        .props("outlined")
                    )

                    message_input = (
                        ui.textarea("Describe your plumbing needs").classes("w-full mb-6").props("outlined rows=4")
                    )

                    # Form validation and submission
                    error_label = ui.label("").classes("text-red-500 mb-4 hidden")
                    success_label = ui.label("").classes("text-green-600 mb-4 hidden")

                    def submit_form():
                        """Submit the contact form"""
                        # Hide previous messages
                        error_label.classes(add="hidden")
                        success_label.classes(add="hidden")

                        # Validate inputs
                        if not name_input.value or not name_input.value.strip():
                            error_label.set_text("Please enter your full name")
                            error_label.classes(remove="hidden")
                            return

                        if not email_input.value or not is_valid_email(email_input.value):
                            error_label.set_text("Please enter a valid email address")
                            error_label.classes(remove="hidden")
                            return

                        if not phone_input.value or not is_valid_phone(phone_input.value):
                            error_label.set_text("Please enter a valid phone number")
                            error_label.classes(remove="hidden")
                            return

                        if not message_input.value or not message_input.value.strip():
                            error_label.set_text("Please describe your plumbing needs")
                            error_label.classes(remove="hidden")
                            return

                        # Create lead data
                        lead_data = ContactLeadCreate(
                            name=name_input.value.strip(),
                            email=email_input.value.strip(),
                            phone_number=phone_input.value.strip(),
                            message=message_input.value.strip(),
                            preferred_contact_method=contact_method.value,
                            service_interest=service_select.value
                            if service_select.value != "General Inquiry"
                            else None,
                        )

                        # Save to database
                        lead = ContactLeadService.create_lead(lead_data)

                        if lead:
                            success_label.set_text("Thank you! We'll contact you within 24 hours.")
                            success_label.classes(remove="hidden")

                            # Clear form
                            name_input.set_value("")
                            email_input.set_value("")
                            phone_input.set_value("")
                            message_input.set_value("")
                            service_select.set_value("General Inquiry")
                            contact_method.set_value("Phone")

                            ui.notify("Quote request submitted successfully!", type="positive")
                        else:
                            error_label.set_text("Sorry, there was an error submitting your request. Please try again.")
                            error_label.classes(remove="hidden")

                    ui.button("Submit Quote Request", on_click=submit_form).classes(
                        "bg-primary hover:bg-blue-700 text-white px-8 py-3 text-lg font-bold rounded-lg w-full"
                    )

    def create_footer():
        """Create the footer section"""
        with ui.element("footer").classes("bg-gray-900 text-white py-12"):
            with ui.column().classes("max-w-6xl mx-auto px-6"):
                with ui.row().classes("gap-8 justify-between items-start flex-wrap"):
                    # Company info
                    with ui.column().classes("gap-3"):
                        ui.label("Professional Plumbing Services").classes("text-xl font-bold mb-3")
                        ui.label("Licensed • Insured • Trusted").classes("text-gray-300")
                        ui.label("📞 (555) 123-PIPE").classes("text-lg")
                        ui.label("📧 info@professionalplumbing.com").classes("text-lg")
                        ui.label("📍 Serving the Greater Metro Area").classes("text-gray-300")

                    # Services
                    with ui.column().classes("gap-2"):
                        ui.label("Services").classes("text-lg font-bold mb-3")
                        service_list = [
                            "Emergency Repairs",
                            "Water Heater Service",
                            "Drain Cleaning",
                            "Pipe Installation",
                            "Bathroom Plumbing",
                            "Sewer Services",
                        ]
                        for service in service_list:
                            ui.label(service).classes("text-gray-300 hover:text-white cursor-pointer")

                    # Hours
                    with ui.column().classes("gap-2"):
                        ui.label("Hours").classes("text-lg font-bold mb-3")
                        ui.label("Emergency: 24/7").classes("text-red-400 font-semibold")
                        ui.label("Mon-Fri: 7AM-6PM").classes("text-gray-300")
                        ui.label("Saturday: 8AM-4PM").classes("text-gray-300")
                        ui.label("Sunday: Emergency Only").classes("text-gray-300")

                with ui.element("hr").classes("border-gray-700 my-8"):
                    pass

                with ui.row().classes("justify-between items-center text-sm text-gray-400"):
                    ui.label("© 2025 Professional Plumbing Services. All rights reserved.")
                    ui.label("Licensed Plumber • Fully Insured • BBB Accredited")

    def scroll_to_contact():
        """Scroll to contact form"""
        ui.run_javascript("""
            document.querySelector('[data-marker="contact-section"]').scrollIntoView({
                behavior: 'smooth'
            });
        """)

    @ui.page("/")
    def landing_page():
        """Main landing page"""
        apply_modern_theme()

        # Add custom CSS for smooth scrolling and animations
        ui.add_head_html("""
            <style>
                html { scroll-behavior: smooth; }
                .gradient-text {
                    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hover-lift {
                    transition: transform 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                }
                @media (max-width: 768px) {
                    .text-5xl { font-size: 2.5rem !important; }
                    .text-4xl { font-size: 2rem !important; }
                    .py-20 { padding-top: 3rem !important; padding-bottom: 3rem !important; }
                    .py-16 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
                }
            </style>
        """)

        # Page title and meta tags
        ui.page_title("Professional Plumbing Services | 24/7 Emergency Plumber")
        ui.add_head_html(
            '<meta name="description" content="Professional plumbing services with 24/7 emergency support. Licensed plumbers for leak repair, water heater installation, drain cleaning, and more. Get your free quote today!">'
        )

        # Build the page sections
        create_hero_section()
        create_services_section()
        create_why_choose_us_section()
        create_testimonials_section()
        create_contact_form()
        create_footer()
