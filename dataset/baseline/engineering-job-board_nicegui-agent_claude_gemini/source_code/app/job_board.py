"""Nerd-style job board UI for engineering positions."""

from nicegui import ui
from typing import Optional, List
from app.job_service import create_job_posting, search_jobs, format_salary_range
from app.models import JobPostingCreate, JobSearchFilters, EngineeringDiscipline, JobPosting
import logging

logger = logging.getLogger(__name__)


def apply_nerd_theme():
    """Apply nerd-style dark theme with terminal aesthetics."""
    ui.colors(
        primary="#00ff41",  # Matrix green
        secondary="#0f4c75",  # Dark blue
        accent="#00ff41",  # Bright green
        positive="#00ff41",  # Success green
        negative="#ff0040",  # Error red
        warning="#ffaa00",  # Warning orange
        info="#00aaff",  # Info cyan
    )

    # Add custom CSS for nerd theme
    ui.add_head_html("""
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        body {
            background: #0d1117;
            color: #c9d1d9;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        
        .nerd-title {
            font-family: 'Fira Code', monospace;
            font-weight: 700;
            color: #00ff41;
            text-shadow: 0 0 10px #00ff41;
        }
        
        .terminal-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 255, 65, 0.1);
        }
        
        .job-card {
            background: #0d1117;
            border: 1px solid #21262d;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        
        .job-card:hover {
            border-color: #00ff41;
            box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
            transform: translateY(-2px);
        }
        
        .discipline-badge {
            background: #1f6feb;
            color: #f0f6fc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .remote-badge {
            background: #238636;
            color: #f0f6fc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .salary-text {
            color: #00ff41;
            font-weight: 600;
        }
        
        .posted-date {
            color: #7d8590;
            font-size: 0.8rem;
        }
        
        .search-input {
            background: #161b22;
            border: 1px solid #30363d;
            color: #c9d1d9;
        }
        
        .search-input:focus {
            border-color: #00ff41;
            box-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
        }
        
        .nerd-button {
            background: #238636;
            border: 1px solid #2ea043;
            color: #f0f6fc;
            font-family: 'Fira Code', monospace;
            font-weight: 500;
        }
        
        .nerd-button:hover {
            background: #2ea043;
            box-shadow: 0 0 10px rgba(46, 160, 67, 0.4);
        }
        
        .ascii-art {
            font-family: 'Fira Code', monospace;
            font-size: 0.7rem;
            color: #00ff41;
            white-space: pre;
        }
    </style>
    """)


class JobBoardUI:
    def __init__(self):
        self.current_jobs: List[JobPosting] = []
        self.search_filters = JobSearchFilters()
        self.selected_job: Optional[JobPosting] = None

    def create_header(self):
        """Create the nerd-style header."""
        with ui.row().classes("w-full items-center justify-between p-4 terminal-card mb-6"):
            with ui.column():
                ui.label("⚡ NERD.JOBS").classes("nerd-title text-3xl")
                ui.label("// Engineering Positions for Code Warriors").classes("text-sm text-gray-400")

            # ASCII art decoration
            ui.html("""
                <pre class="ascii-art">
 ┌─┐┌─┐┌┬┐┌─┐
 │  │ │ ││├┤ 
 └─┘└─┘─┴┘└─┘
                </pre>
            """).classes("hidden md:block")

    def create_search_filters(self):
        """Create search and filter interface."""
        with ui.card().classes("w-full terminal-card p-4 mb-6"):
            ui.label("🔍 Search & Filter").classes("text-lg font-bold text-primary mb-4")

            with ui.row().classes("w-full gap-4"):
                # Keyword search
                with ui.column().classes("flex-1"):
                    ui.label("Keywords").classes("text-sm text-gray-400 mb-1")
                    search_input = (
                        ui.input(placeholder="Search jobs, companies, descriptions...")
                        .classes("w-full search-input")
                        .props("outlined dense")
                    )
                    search_input.bind_value(self.search_filters, "keyword")

                # Engineering discipline filter
                with ui.column().classes("w-48"):
                    ui.label("Discipline").classes("text-sm text-gray-400 mb-1")
                    discipline_options = [None] + list(EngineeringDiscipline)
                    discipline_select = (
                        ui.select(
                            options={d: d.value if d else "All Disciplines" for d in discipline_options}, value=None
                        )
                        .classes("w-full search-input")
                        .props("outlined dense")
                    )
                    discipline_select.bind_value(self.search_filters, "engineering_discipline")

                # Location filter
                with ui.column().classes("w-48"):
                    ui.label("Location").classes("text-sm text-gray-400 mb-1")
                    location_input = (
                        ui.input(placeholder="City, State, Remote...")
                        .classes("w-full search-input")
                        .props("outlined dense")
                    )
                    location_input.bind_value(self.search_filters, "location")

            with ui.row().classes("mt-4 gap-4"):
                # Remote friendly checkbox
                remote_checkbox = ui.checkbox("Remote Friendly").classes("text-primary")
                remote_checkbox.bind_value(self.search_filters, "remote_friendly")

                # Search button
                ui.button("🚀 Search", on_click=self.perform_search).classes("nerd-button px-6 py-2")
                ui.button("🔄 Clear", on_click=self.clear_filters).classes("px-4 py-2").props("outline")

    def create_job_posting_form(self):
        """Create job posting form for employers."""
        with ui.card().classes("w-full terminal-card p-6 mb-6"):
            ui.label("📝 Post a Job").classes("text-xl font-bold text-primary mb-4")

            # Form fields
            self.form_data = JobPostingCreate(
                job_title="",
                company_name="",
                job_description="",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="",
                application_url="",
                salary_min=None,
                salary_max=None,
                remote_friendly=False,
            )

            with ui.row().classes("w-full gap-4"):
                with ui.column().classes("flex-1"):
                    ui.label("Job Title *").classes("text-sm text-gray-400 mb-1")
                    ui.input(placeholder="Senior Software Engineer").classes("w-full search-input").props(
                        "outlined"
                    ).bind_value(self.form_data, "job_title")

                with ui.column().classes("flex-1"):
                    ui.label("Company Name *").classes("text-sm text-gray-400 mb-1")
                    ui.input(placeholder="Tech Corp Inc.").classes("w-full search-input").props("outlined").bind_value(
                        self.form_data, "company_name"
                    )

            with ui.row().classes("w-full gap-4 mt-4"):
                with ui.column().classes("flex-1"):
                    ui.label("Engineering Discipline *").classes("text-sm text-gray-400 mb-1")
                    ui.select(
                        options={d: d.value for d in EngineeringDiscipline}, value=EngineeringDiscipline.SOFTWARE
                    ).classes("w-full search-input").props("outlined").bind_value(
                        self.form_data, "engineering_discipline"
                    )

                with ui.column().classes("flex-1"):
                    ui.label("Location *").classes("text-sm text-gray-400 mb-1")
                    ui.input(placeholder="San Francisco, CA / Remote").classes("w-full search-input").props(
                        "outlined"
                    ).bind_value(self.form_data, "location")

            with ui.column().classes("w-full mt-4"):
                ui.label("Job Description *").classes("text-sm text-gray-400 mb-1")
                ui.textarea(placeholder="Describe the role, requirements, and what makes it awesome...").classes(
                    "w-full search-input"
                ).props("outlined rows=4").bind_value(self.form_data, "job_description")

            with ui.row().classes("w-full gap-4 mt-4"):
                with ui.column().classes("flex-1"):
                    ui.label("Application URL *").classes("text-sm text-gray-400 mb-1")
                    ui.input(placeholder="https://company.com/careers/job-123").classes("w-full search-input").props(
                        "outlined"
                    ).bind_value(self.form_data, "application_url")

                with ui.column().classes("w-32"):
                    ui.label("Min Salary").classes("text-sm text-gray-400 mb-1")
                    ui.number(placeholder="80000").classes("w-full search-input").props("outlined").bind_value(
                        self.form_data, "salary_min"
                    )

                with ui.column().classes("w-32"):
                    ui.label("Max Salary").classes("text-sm text-gray-400 mb-1")
                    ui.number(placeholder="120000").classes("w-full search-input").props("outlined").bind_value(
                        self.form_data, "salary_max"
                    )

            with ui.row().classes("mt-4 items-center gap-4"):
                ui.checkbox("Remote Friendly").classes("text-primary").bind_value(self.form_data, "remote_friendly")
                ui.button("🚀 Post Job", on_click=self.submit_job_posting).classes("nerd-button px-6 py-2")

    def create_job_listings(self):
        """Create job listings display."""
        with ui.column().classes("w-full gap-4") as self.listings_container:
            self.refresh_job_listings()

    def create_job_card(self, job: JobPosting):
        """Create a single job card."""
        with ui.card().classes("job-card p-4 cursor-pointer"):
            with ui.column().classes("w-full").on("click", lambda: self.show_job_details(job)):
                with ui.row().classes("w-full items-start justify-between"):
                    with ui.column().classes("flex-1"):
                        # Job title and company
                        ui.label(job.job_title).classes("text-lg font-bold text-white")
                        ui.label(f"@ {job.company_name}").classes("text-primary font-medium")

                        # Location and remote badge
                        with ui.row().classes("mt-2 gap-2 items-center"):
                            ui.label(f"📍 {job.location}").classes("text-sm text-gray-400")
                            if job.remote_friendly:
                                ui.html('<span class="remote-badge">🏠 Remote OK</span>')

                    with ui.column().classes("items-end"):
                        # Discipline badge
                        ui.html(f'<span class="discipline-badge">{job.engineering_discipline.value}</span>')

                        # Salary
                        if job.salary_min is not None or job.salary_max is not None:
                            ui.label(format_salary_range(job.salary_min, job.salary_max)).classes("salary-text mt-2")

                        # Posted date
                        posted_ago = self.time_ago(job.posted_at)
                        ui.label(f"Posted {posted_ago}").classes("posted-date mt-2")

    def show_job_details(self, job: JobPosting):
        """Show job details in a modal dialog."""
        with ui.dialog() as dialog, ui.card().classes("w-full max-w-4xl terminal-card"):
            with ui.row().classes("w-full items-center justify-between mb-4"):
                ui.label("Job Details").classes("text-xl font-bold text-primary")
                ui.button("✕", on_click=dialog.close).classes("text-gray-400").props("flat dense round")

            with ui.scroll_area().classes("max-h-96"):
                with ui.column().classes("gap-4"):
                    # Job header
                    ui.label(job.job_title).classes("text-2xl font-bold text-white")
                    ui.label(f"@ {job.company_name}").classes("text-lg text-primary font-medium")

                    # Meta info
                    with ui.row().classes("gap-4 items-center flex-wrap"):
                        ui.html(f'<span class="discipline-badge">{job.engineering_discipline.value}</span>')
                        ui.label(f"📍 {job.location}").classes("text-gray-400")
                        if job.remote_friendly:
                            ui.html('<span class="remote-badge">🏠 Remote OK</span>')
                        if job.salary_min is not None or job.salary_max is not None:
                            ui.label(format_salary_range(job.salary_min, job.salary_max)).classes("salary-text")

                    ui.separator().classes("my-4")

                    # Job description
                    ui.label("Description").classes("text-lg font-bold text-white mb-2")
                    ui.markdown(job.job_description).classes("text-gray-300")

                    ui.separator().classes("my-4")

                    # Application section
                    with ui.row().classes("items-center gap-4"):
                        ui.label("Ready to apply?").classes("text-lg text-white")
                        ui.link("🚀 Apply Now", job.application_url, new_tab=True).classes(
                            "nerd-button px-6 py-2 no-underline"
                        )

        dialog.open()

    def perform_search(self):
        """Perform job search with current filters."""
        try:
            self.current_jobs = search_jobs(self.search_filters)
            self.refresh_job_listings()
            ui.notify(f"Found {len(self.current_jobs)} jobs", type="positive")
        except Exception as e:
            logger.error(f"Search error: {e}")
            ui.notify("Search failed. Please try again.", type="negative")

    def clear_filters(self):
        """Clear all search filters."""
        self.search_filters = JobSearchFilters()
        self.current_jobs = search_jobs(self.search_filters)
        self.refresh_job_listings()
        ui.notify("Filters cleared", type="info")

    def refresh_job_listings(self):
        """Refresh the job listings display."""
        if not hasattr(self, "listings_container"):
            return

        self.listings_container.clear()
        with self.listings_container:
            if not self.current_jobs:
                self.current_jobs = search_jobs(JobSearchFilters())

            if self.current_jobs:
                ui.label(f"💼 {len(self.current_jobs)} Engineering Positions").classes(
                    "text-lg font-bold text-primary mb-4"
                )
                for job in self.current_jobs:
                    self.create_job_card(job)
            else:
                with ui.card().classes("terminal-card p-8 text-center"):
                    ui.label("🔍 No jobs found").classes("text-xl text-gray-400 mb-2")
                    ui.label("Try adjusting your search criteria or post the first job!").classes("text-gray-500")

    def submit_job_posting(self):
        """Submit a new job posting."""
        try:
            # Basic validation
            if not all(
                [
                    self.form_data.job_title.strip(),
                    self.form_data.company_name.strip(),
                    self.form_data.job_description.strip(),
                    self.form_data.location.strip(),
                    self.form_data.application_url.strip(),
                ]
            ):
                ui.notify("Please fill in all required fields", type="warning")
                return

            if not self.form_data.application_url.startswith(("http://", "https://")):
                ui.notify("Application URL must start with http:// or https://", type="warning")
                return

            if len(self.form_data.job_description.strip()) < 50:
                ui.notify("Job description must be at least 50 characters", type="warning")
                return

            # Create job posting
            created_job = create_job_posting(self.form_data)
            if created_job is not None:
                ui.notify("🎉 Job posted successfully!", type="positive")

                # Reset form
                self.form_data = JobPostingCreate(
                    job_title="",
                    company_name="",
                    job_description="",
                    engineering_discipline=EngineeringDiscipline.SOFTWARE,
                    location="",
                    application_url="",
                    salary_min=None,
                    salary_max=None,
                    remote_friendly=False,
                )

                # Refresh listings
                self.perform_search()
            else:
                ui.notify("Failed to post job. Please try again.", type="negative")

        except Exception as e:
            logger.error(f"Job posting error: {e}")
            ui.notify("An error occurred. Please try again.", type="negative")

    def time_ago(self, posted_at) -> str:
        """Calculate time ago string."""
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        if posted_at.tzinfo is None:
            posted_at = posted_at.replace(tzinfo=timezone.utc)

        diff = now - posted_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"


def create():
    """Create the job board application."""
    apply_nerd_theme()

    @ui.page("/")
    def job_board_page():
        job_board = JobBoardUI()

        with ui.column().classes("w-full max-w-6xl mx-auto p-4"):
            job_board.create_header()
            job_board.create_search_filters()
            job_board.create_job_posting_form()
            job_board.create_job_listings()
