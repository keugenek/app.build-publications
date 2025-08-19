"""Business logic for job posting operations."""

from typing import Optional, List
from sqlmodel import select
from app.database import get_session
from app.models import JobPosting, JobPostingCreate, JobSearchFilters, EngineeringDiscipline
import logging

logger = logging.getLogger(__name__)


def create_job_posting(job_data: JobPostingCreate) -> Optional[JobPosting]:
    """Create a new job posting."""
    try:
        with get_session() as session:
            job = JobPosting(
                job_title=job_data.job_title.strip(),
                company_name=job_data.company_name.strip(),
                job_description=job_data.job_description.strip(),
                engineering_discipline=job_data.engineering_discipline,
                location=job_data.location.strip(),
                application_url=job_data.application_url.strip(),
                salary_min=job_data.salary_min,
                salary_max=job_data.salary_max,
                remote_friendly=job_data.remote_friendly,
            )
            session.add(job)
            session.commit()
            session.refresh(job)
            return job
    except Exception as e:
        logger.error(f"Error creating job posting: {e}")
        return None


def get_job_posting(job_id: int) -> Optional[JobPosting]:
    """Get a specific job posting by ID."""
    try:
        with get_session() as session:
            return session.get(JobPosting, job_id)
    except Exception as e:
        logger.error(f"Error retrieving job posting {job_id}: {e}")
        return None


def search_jobs(filters: JobSearchFilters) -> List[JobPosting]:
    """Search and filter job postings."""
    try:
        with get_session() as session:
            statement = select(JobPosting)

            # Apply filters
            if filters.active_only:
                statement = statement.where(JobPosting.is_active)

            if filters.engineering_discipline is not None:
                statement = statement.where(JobPosting.engineering_discipline == filters.engineering_discipline)

            if filters.location is not None and filters.location.strip():
                from sqlalchemy import func

                location_filter = f"%{filters.location.strip().lower()}%"
                statement = statement.where(func.lower(JobPosting.location).like(location_filter))

            if filters.remote_friendly is not None:
                statement = statement.where(JobPosting.remote_friendly == filters.remote_friendly)

            if filters.salary_min is not None:
                # Only include jobs that have salary_min set and meet the criteria
                statement = statement.where(JobPosting.salary_min >= filters.salary_min)  # type: ignore[operator]

            if filters.keyword is not None and filters.keyword.strip():
                from sqlalchemy import func, or_

                keyword = f"%{filters.keyword.strip().lower()}%"
                statement = statement.where(
                    or_(
                        func.lower(JobPosting.job_title).like(keyword),
                        func.lower(JobPosting.job_description).like(keyword),
                        func.lower(JobPosting.company_name).like(keyword),
                    )
                )

            # Order by posting date (newest first)
            statement = statement.order_by(JobPosting.id.desc())  # type: ignore[attr-defined]

            results = session.exec(statement).all()
            return list(results)
    except Exception as e:
        logger.error(f"Error searching jobs: {e}")
        return []


def get_all_active_jobs() -> List[JobPosting]:
    """Get all active job postings."""
    filters = JobSearchFilters(active_only=True)
    return search_jobs(filters)


def deactivate_job_posting(job_id: int) -> bool:
    """Deactivate a job posting."""
    try:
        with get_session() as session:
            job = session.get(JobPosting, job_id)
            if job is None:
                return False
            job.is_active = False
            session.add(job)
            session.commit()
            return True
    except Exception as e:
        logger.error(f"Error deactivating job posting {job_id}: {e}")
        return False


def get_unique_locations() -> List[str]:
    """Get all unique locations from active job postings for filter dropdown."""
    try:
        with get_session() as session:
            statement = select(JobPosting.location).where(JobPosting.is_active).distinct()
            results = session.exec(statement).all()
            return sorted([loc for loc in results if loc.strip()])
    except Exception as e:
        logger.error(f"Error getting unique locations: {e}")
        return []


def get_job_count_by_discipline() -> dict[EngineeringDiscipline, int]:
    """Get count of active jobs by engineering discipline."""
    try:
        with get_session() as session:
            job_counts = {}
            for discipline in EngineeringDiscipline:
                statement = select(JobPosting).where(
                    JobPosting.is_active, JobPosting.engineering_discipline == discipline
                )
                count = len(session.exec(statement).all())
                if count > 0:
                    job_counts[discipline] = count
            return job_counts
    except Exception as e:
        logger.error(f"Error getting job counts by discipline: {e}")
        return {}


def format_salary_range(salary_min: Optional[int], salary_max: Optional[int]) -> str:
    """Format salary range for display."""
    if salary_min is not None and salary_max is not None:
        return f"${salary_min:,} - ${salary_max:,}"
    elif salary_min is not None:
        return f"${salary_min:,}+"
    elif salary_max is not None:
        return f"Up to ${salary_max:,}"
    else:
        return "Salary not specified"
