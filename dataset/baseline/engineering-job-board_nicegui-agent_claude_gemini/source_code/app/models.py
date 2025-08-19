from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class EngineeringDiscipline(str, Enum):
    """Engineering discipline categories for job postings."""

    SOFTWARE = "Software Engineering"
    HARDWARE = "Hardware Engineering"
    MECHANICAL = "Mechanical Engineering"
    ELECTRICAL = "Electrical Engineering"
    CIVIL = "Civil Engineering"
    CHEMICAL = "Chemical Engineering"
    AEROSPACE = "Aerospace Engineering"
    BIOMEDICAL = "Biomedical Engineering"
    INDUSTRIAL = "Industrial Engineering"
    ENVIRONMENTAL = "Environmental Engineering"
    MATERIALS = "Materials Engineering"
    NUCLEAR = "Nuclear Engineering"
    PETROLEUM = "Petroleum Engineering"
    COMPUTER = "Computer Engineering"
    DATA = "Data Engineering"
    ROBOTICS = "Robotics Engineering"
    SYSTEMS = "Systems Engineering"
    NETWORK = "Network Engineering"
    SECURITY = "Security Engineering"
    DEVOPS = "DevOps Engineering"


# Persistent models (stored in database)
class JobPosting(SQLModel, table=True):
    """Main job posting model for engineering positions."""

    __tablename__ = "job_postings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    job_title: str = Field(max_length=200, description="Title of the engineering position")
    company_name: str = Field(max_length=100, description="Name of the hiring company")
    job_description: str = Field(max_length=5000, description="Detailed job description and requirements")
    engineering_discipline: EngineeringDiscipline = Field(description="Primary engineering discipline for this role")
    location: str = Field(max_length=200, description="Job location (city, state/country, remote, etc.)")
    application_url: str = Field(max_length=500, description="External URL where candidates can apply")

    # Metadata fields
    posted_at: datetime = Field(default_factory=datetime.utcnow, description="When the job was posted")
    is_active: bool = Field(default=True, description="Whether the job posting is currently active")

    # Optional additional fields for future enhancement
    salary_min: Optional[int] = Field(default=None, description="Minimum salary range")
    salary_max: Optional[int] = Field(default=None, description="Maximum salary range")
    remote_friendly: bool = Field(default=False, description="Whether remote work is allowed")


# Non-persistent schemas (for validation, forms, API requests/responses)
class JobPostingCreate(SQLModel, table=False):
    """Schema for creating new job postings."""

    job_title: str = Field(max_length=200, min_length=1)
    company_name: str = Field(max_length=100, min_length=1)
    job_description: str = Field(max_length=5000, min_length=10)
    engineering_discipline: EngineeringDiscipline
    location: str = Field(max_length=200, min_length=1)
    application_url: str = Field(max_length=500, min_length=1, regex=r"^https?://.*")
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    remote_friendly: bool = Field(default=False)


class JobPostingUpdate(SQLModel, table=False):
    """Schema for updating existing job postings."""

    job_title: Optional[str] = Field(default=None, max_length=200, min_length=1)
    company_name: Optional[str] = Field(default=None, max_length=100, min_length=1)
    job_description: Optional[str] = Field(default=None, max_length=5000, min_length=10)
    engineering_discipline: Optional[EngineeringDiscipline] = Field(default=None)
    location: Optional[str] = Field(default=None, max_length=200, min_length=1)
    application_url: Optional[str] = Field(default=None, max_length=500, min_length=1, regex=r"^https?://.*")
    is_active: Optional[bool] = Field(default=None)
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    remote_friendly: Optional[bool] = Field(default=None)


class JobSearchFilters(SQLModel, table=False):
    """Schema for job search and filtering parameters."""

    keyword: Optional[str] = Field(
        default=None, max_length=200, description="Search across title, description, company"
    )
    engineering_discipline: Optional[EngineeringDiscipline] = Field(
        default=None, description="Filter by engineering discipline"
    )
    location: Optional[str] = Field(default=None, max_length=200, description="Filter by location")
    remote_friendly: Optional[bool] = Field(default=None, description="Filter for remote-friendly positions")
    salary_min: Optional[int] = Field(default=None, ge=0, description="Minimum salary requirement")
    active_only: bool = Field(default=True, description="Only show active job postings")


class JobPostingResponse(SQLModel, table=False):
    """Schema for returning job posting data in API responses."""

    id: int
    job_title: str
    company_name: str
    job_description: str
    engineering_discipline: EngineeringDiscipline
    location: str
    application_url: str
    posted_at: str  # ISO format datetime string
    is_active: bool
    salary_min: Optional[int]
    salary_max: Optional[int]
    remote_friendly: bool

    @classmethod
    def from_job_posting(cls, job: JobPosting) -> "JobPostingResponse":
        """Convert a JobPosting model to a response schema."""
        return cls(
            id=job.id if job.id is not None else 0,
            job_title=job.job_title,
            company_name=job.company_name,
            job_description=job.job_description,
            engineering_discipline=job.engineering_discipline,
            location=job.location,
            application_url=job.application_url,
            posted_at=job.posted_at.isoformat(),
            is_active=job.is_active,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            remote_friendly=job.remote_friendly,
        )


class JobListingItem(SQLModel, table=False):
    """Lightweight schema for job listing displays (without full description)."""

    id: int
    job_title: str
    company_name: str
    engineering_discipline: EngineeringDiscipline
    location: str
    posted_at: str  # ISO format datetime string
    salary_min: Optional[int]
    salary_max: Optional[int]
    remote_friendly: bool

    @classmethod
    def from_job_posting(cls, job: JobPosting) -> "JobListingItem":
        """Convert a JobPosting model to a listing item schema."""
        return cls(
            id=job.id if job.id is not None else 0,
            job_title=job.job_title,
            company_name=job.company_name,
            engineering_discipline=job.engineering_discipline,
            location=job.location,
            posted_at=job.posted_at.isoformat(),
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            remote_friendly=job.remote_friendly,
        )
