"""Tests for job service business logic."""

import pytest
from app.job_service import (
    create_job_posting,
    get_job_posting,
    search_jobs,
    get_all_active_jobs,
    deactivate_job_posting,
    get_unique_locations,
    format_salary_range,
)
from app.models import JobPostingCreate, JobSearchFilters, EngineeringDiscipline
from app.database import reset_db


@pytest.fixture
def new_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


@pytest.fixture
def sample_job_data():
    """Sample job posting data for tests."""
    return JobPostingCreate(
        job_title="Senior Software Engineer",
        company_name="Tech Corp",
        job_description="Join our team to build amazing software products using Python, React, and modern cloud technologies.",
        engineering_discipline=EngineeringDiscipline.SOFTWARE,
        location="San Francisco, CA",
        application_url="https://techcorp.com/careers/senior-engineer",
        salary_min=120000,
        salary_max=180000,
        remote_friendly=True,
    )


class TestJobPostingCreation:
    """Test job posting creation functionality."""

    def test_create_valid_job_posting(self, new_db, sample_job_data):
        """Test creating a valid job posting."""
        job = create_job_posting(sample_job_data)

        assert job is not None
        assert job.id is not None
        assert job.job_title == "Senior Software Engineer"
        assert job.company_name == "Tech Corp"
        assert job.engineering_discipline == EngineeringDiscipline.SOFTWARE
        assert job.location == "San Francisco, CA"
        assert job.salary_min == 120000
        assert job.salary_max == 180000
        assert job.remote_friendly
        assert job.is_active
        assert job.posted_at is not None

    def test_create_job_with_minimal_data(self, new_db):
        """Test creating job with only required fields."""
        minimal_data = JobPostingCreate(
            job_title="Junior Developer",
            company_name="Startup Inc",
            job_description="Learn and grow with our fast-paced startup environment.",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Remote",
            application_url="https://startup.com/jobs/junior-dev",
        )

        job = create_job_posting(minimal_data)

        assert job is not None
        assert job.salary_min is None
        assert job.salary_max is None
        assert not job.remote_friendly  # Default value

    def test_create_job_trims_whitespace(self, new_db):
        """Test that job creation trims whitespace from fields."""
        data = JobPostingCreate(
            job_title="  Software Engineer  ",
            company_name="  TechCo  ",
            job_description="  Great opportunity to work with amazing team.  ",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="  New York, NY  ",
            application_url="  https://techco.com/job  ",
        )

        job = create_job_posting(data)

        assert job is not None
        assert job.job_title == "Software Engineer"
        assert job.company_name == "TechCo"
        assert job.location == "New York, NY"
        assert job.application_url == "https://techco.com/job"


class TestJobRetrieval:
    """Test job retrieval functionality."""

    def test_get_existing_job_posting(self, new_db, sample_job_data):
        """Test retrieving an existing job posting."""
        created_job = create_job_posting(sample_job_data)
        assert created_job is not None

        if created_job.id is not None:
            retrieved_job = get_job_posting(created_job.id)
        else:
            retrieved_job = None

        assert retrieved_job is not None
        assert retrieved_job.id == created_job.id
        assert retrieved_job.job_title == created_job.job_title

    def test_get_nonexistent_job_posting(self, new_db):
        """Test retrieving a non-existent job posting."""
        job = get_job_posting(999)
        assert job is None


class TestJobSearch:
    """Test job search and filtering functionality."""

    @pytest.fixture
    def sample_jobs(self, new_db):
        """Create sample jobs for search tests."""
        jobs_data = [
            JobPostingCreate(
                job_title="Senior Python Developer",
                company_name="Python Corp",
                job_description="Build scalable web applications with Django and FastAPI.",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="San Francisco, CA",
                application_url="https://pythoncorp.com/senior-python",
                salary_min=130000,
                remote_friendly=True,
            ),
            JobPostingCreate(
                job_title="Frontend React Engineer",
                company_name="UI Masters",
                job_description="Create beautiful user interfaces with React and TypeScript.",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="New York, NY",
                application_url="https://uimasters.com/frontend-react",
                salary_max=150000,
                remote_friendly=False,
            ),
            JobPostingCreate(
                job_title="Mechanical Design Engineer",
                company_name="Robotics Inc",
                job_description="Design innovative robotic systems for manufacturing.",
                engineering_discipline=EngineeringDiscipline.MECHANICAL,
                location="Detroit, MI",
                application_url="https://robotics.com/mechanical-design",
                salary_min=90000,
                salary_max=120000,
                remote_friendly=False,
            ),
            JobPostingCreate(
                job_title="DevOps Engineer",
                company_name="Cloud Solutions",
                job_description="Manage AWS infrastructure and deployment pipelines.",
                engineering_discipline=EngineeringDiscipline.DEVOPS,
                location="Remote",
                application_url="https://cloudsolutions.com/devops",
                remote_friendly=True,
            ),
        ]

        created_jobs = []
        for data in jobs_data:
            job = create_job_posting(data)
            if job is not None:
                created_jobs.append(job)

        return created_jobs

    def test_search_all_jobs(self, sample_jobs):
        """Test searching for all active jobs."""
        filters = JobSearchFilters(active_only=True)
        results = search_jobs(filters)

        assert len(results) == 4
        assert all(job.is_active for job in results)

    def test_search_by_keyword_title(self, sample_jobs):
        """Test searching by keyword in job title."""
        filters = JobSearchFilters(keyword="Python")
        results = search_jobs(filters)

        assert len(results) == 1
        assert "Python" in results[0].job_title

    def test_search_by_keyword_description(self, sample_jobs):
        """Test searching by keyword in job description."""
        filters = JobSearchFilters(keyword="React")
        results = search_jobs(filters)

        assert len(results) == 1
        assert "React" in results[0].job_description

    def test_search_by_keyword_company(self, sample_jobs):
        """Test searching by keyword in company name."""
        filters = JobSearchFilters(keyword="Robotics")
        results = search_jobs(filters)

        assert len(results) == 1
        assert "Robotics" in results[0].company_name

    def test_search_by_engineering_discipline(self, sample_jobs):
        """Test filtering by engineering discipline."""
        filters = JobSearchFilters(engineering_discipline=EngineeringDiscipline.SOFTWARE)
        results = search_jobs(filters)

        assert len(results) == 2
        assert all(job.engineering_discipline == EngineeringDiscipline.SOFTWARE for job in results)

    def test_search_by_location(self, sample_jobs):
        """Test filtering by location."""
        filters = JobSearchFilters(location="San Francisco")
        results = search_jobs(filters)

        assert len(results) == 1
        assert "San Francisco" in results[0].location

    def test_search_remote_friendly(self, sample_jobs):
        """Test filtering for remote-friendly jobs."""
        filters = JobSearchFilters(remote_friendly=True)
        results = search_jobs(filters)

        assert len(results) == 2
        assert all(job.remote_friendly for job in results)

    def test_search_by_minimum_salary(self, sample_jobs):
        """Test filtering by minimum salary."""
        filters = JobSearchFilters(salary_min=120000)
        results = search_jobs(filters)

        # Only jobs with salary_min >= 120000
        assert len(results) == 1
        assert results[0].salary_min is not None and results[0].salary_min >= 120000

    def test_search_case_insensitive(self, sample_jobs):
        """Test that searches are case insensitive."""
        filters = JobSearchFilters(keyword="python")
        results = search_jobs(filters)

        assert len(results) == 1
        assert "Python" in results[0].job_title

    def test_search_no_results(self, sample_jobs):
        """Test search with no matching results."""
        filters = JobSearchFilters(keyword="NonexistentTechnology")
        results = search_jobs(filters)

        assert len(results) == 0

    def test_search_combined_filters(self, sample_jobs):
        """Test search with multiple filters combined."""
        filters = JobSearchFilters(engineering_discipline=EngineeringDiscipline.SOFTWARE, remote_friendly=True)
        results = search_jobs(filters)

        assert len(results) == 1
        assert results[0].engineering_discipline == EngineeringDiscipline.SOFTWARE
        assert results[0].remote_friendly


class TestJobDeactivation:
    """Test job deactivation functionality."""

    def test_deactivate_existing_job(self, new_db, sample_job_data):
        """Test deactivating an existing job."""
        job = create_job_posting(sample_job_data)
        assert job is not None
        assert job.is_active

        if job.id is not None:
            success = deactivate_job_posting(job.id)
            assert success

            # Verify job is deactivated
            updated_job = get_job_posting(job.id)
        else:
            updated_job = None
            success = False
        assert updated_job is not None
        assert not updated_job.is_active

    def test_deactivate_nonexistent_job(self, new_db):
        """Test deactivating a non-existent job."""
        success = deactivate_job_posting(999)
        assert not success


class TestUtilityFunctions:
    """Test utility functions."""

    def test_get_all_active_jobs(self, new_db, sample_job_data):
        """Test getting all active jobs."""
        # Create active job
        active_job = create_job_posting(sample_job_data)
        assert active_job is not None

        # Create and deactivate another job
        inactive_data = JobPostingCreate(
            job_title="Inactive Job",
            company_name="Old Company",
            job_description="This job is no longer available.",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Nowhere",
            application_url="https://oldcompany.com/job",
        )
        inactive_job = create_job_posting(inactive_data)
        assert inactive_job is not None
        if inactive_job.id is not None:
            deactivate_job_posting(inactive_job.id)

        # Get all active jobs
        active_jobs = get_all_active_jobs()

        assert len(active_jobs) == 1
        assert active_jobs[0].id == active_job.id

    def test_get_unique_locations_empty(self, new_db):
        """Test getting unique locations with no jobs."""
        locations = get_unique_locations()
        assert locations == []

    def test_get_unique_locations_with_jobs(self, new_db):
        """Test getting unique locations with sample jobs."""
        jobs_data = [
            JobPostingCreate(
                job_title="Job 1",
                company_name="Company 1",
                job_description="Description 1",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="San Francisco, CA",
                application_url="https://company1.com/job1",
            ),
            JobPostingCreate(
                job_title="Job 2",
                company_name="Company 2",
                job_description="Description 2",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="New York, NY",
                application_url="https://company2.com/job2",
            ),
            JobPostingCreate(
                job_title="Job 3",
                company_name="Company 3",
                job_description="Description 3",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="San Francisco, CA",  # Duplicate
                application_url="https://company3.com/job3",
            ),
        ]

        for data in jobs_data:
            create_job_posting(data)

        locations = get_unique_locations()

        assert len(locations) == 2
        assert "New York, NY" in locations
        assert "San Francisco, CA" in locations

    def test_format_salary_range_both_values(self):
        """Test formatting salary range with both min and max."""
        result = format_salary_range(80000, 120000)
        assert result == "$80,000 - $120,000"

    def test_format_salary_range_min_only(self):
        """Test formatting salary range with min only."""
        result = format_salary_range(90000, None)
        assert result == "$90,000+"

    def test_format_salary_range_max_only(self):
        """Test formatting salary range with max only."""
        result = format_salary_range(None, 100000)
        assert result == "Up to $100,000"

    def test_format_salary_range_no_values(self):
        """Test formatting salary range with no values."""
        result = format_salary_range(None, None)
        assert result == "Salary not specified"


class TestErrorHandling:
    """Test error handling in service functions."""

    def test_search_with_empty_filters(self, new_db):
        """Test search with default/empty filters."""
        filters = JobSearchFilters()
        results = search_jobs(filters)
        assert isinstance(results, list)  # Should return empty list, not error

    def test_search_with_none_values(self, new_db):
        """Test search handles None values gracefully."""
        filters = JobSearchFilters(
            keyword=None, engineering_discipline=None, location=None, remote_friendly=None, salary_min=None
        )
        results = search_jobs(filters)
        assert isinstance(results, list)


class TestJobSearchOrder:
    """Test job search result ordering."""

    def test_search_results_ordered_by_date(self, new_db):
        """Test that search results are ordered by posting date (newest first)."""
        # Create multiple jobs with slight delay to ensure different timestamps
        import time

        first_job_data = JobPostingCreate(
            job_title="First Job",
            company_name="Company A",
            job_description="First job posted",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Location A",
            application_url="https://companya.com/first",
        )
        first_job = create_job_posting(first_job_data)

        time.sleep(0.1)  # Small delay

        second_job_data = JobPostingCreate(
            job_title="Second Job",
            company_name="Company B",
            job_description="Second job posted",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Location B",
            application_url="https://companyb.com/second",
        )
        second_job = create_job_posting(second_job_data)

        # Search all jobs
        filters = JobSearchFilters()
        results = search_jobs(filters)

        assert len(results) == 2
        # Newest job should be first
        if second_job is not None and first_job is not None:
            assert results[0].id == second_job.id
            assert results[1].id == first_job.id
