"""Integration tests that verify job board service logic works correctly."""

import pytest
from app.database import reset_db
from app.job_service import create_job_posting, search_jobs
from app.models import JobPostingCreate, JobSearchFilters, EngineeringDiscipline


@pytest.fixture
def new_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


class TestJobBoardWorkflow:
    """Test complete job board workflows."""

    def test_complete_job_posting_workflow(self, new_db):
        """Test the complete workflow of posting and finding jobs."""
        # Create multiple jobs
        jobs_data = [
            JobPostingCreate(
                job_title="Senior Python Engineer",
                company_name="Python Corp",
                job_description="Build scalable backend systems with Python, Django, and PostgreSQL. Work remotely with a distributed team.",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="Remote",
                application_url="https://pythoncorp.com/careers/senior-python",
                salary_min=130000,
                salary_max=180000,
                remote_friendly=True,
            ),
            JobPostingCreate(
                job_title="Frontend React Developer",
                company_name="UI Masters",
                job_description="Create beautiful, responsive user interfaces using React, TypeScript, and modern CSS frameworks.",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location="San Francisco, CA",
                application_url="https://uimasters.com/jobs/frontend-react",
                salary_min=110000,
                salary_max=150000,
                remote_friendly=False,
            ),
            JobPostingCreate(
                job_title="DevOps Engineer",
                company_name="Cloud Solutions Inc",
                job_description="Manage AWS infrastructure, CI/CD pipelines, and monitoring systems for high-traffic applications.",
                engineering_discipline=EngineeringDiscipline.DEVOPS,
                location="Austin, TX",
                application_url="https://cloudsolutions.com/careers/devops",
                salary_min=120000,
                salary_max=160000,
                remote_friendly=True,
            ),
            JobPostingCreate(
                job_title="Mechanical Design Engineer",
                company_name="Robotics Innovations",
                job_description="Design mechanical components for industrial automation robots using CAD software and 3D printing.",
                engineering_discipline=EngineeringDiscipline.MECHANICAL,
                location="Detroit, MI",
                application_url="https://robotics-innovations.com/jobs/mechanical-design",
                salary_min=90000,
                salary_max=130000,
                remote_friendly=False,
            ),
        ]

        created_jobs = []
        for job_data in jobs_data:
            job = create_job_posting(job_data)
            assert job is not None
            created_jobs.append(job)

        # Test various search scenarios

        # 1. Search all jobs
        all_jobs = search_jobs(JobSearchFilters())
        assert len(all_jobs) == 4

        # 2. Search by keyword in title
        python_jobs = search_jobs(JobSearchFilters(keyword="Python"))
        assert len(python_jobs) == 1
        assert "Python" in python_jobs[0].job_title

        # 3. Search by keyword in description
        react_jobs = search_jobs(JobSearchFilters(keyword="React"))
        assert len(react_jobs) == 1
        assert "React" in react_jobs[0].job_description

        # 4. Search by engineering discipline
        software_jobs = search_jobs(JobSearchFilters(engineering_discipline=EngineeringDiscipline.SOFTWARE))
        assert len(software_jobs) == 2

        mechanical_jobs = search_jobs(JobSearchFilters(engineering_discipline=EngineeringDiscipline.MECHANICAL))
        assert len(mechanical_jobs) == 1

        # 5. Search by location
        remote_location_jobs = search_jobs(JobSearchFilters(location="Remote"))
        assert len(remote_location_jobs) == 1

        sf_jobs = search_jobs(JobSearchFilters(location="San Francisco"))
        assert len(sf_jobs) == 1

        # 6. Search remote-friendly jobs
        remote_friendly_jobs = search_jobs(JobSearchFilters(remote_friendly=True))
        assert len(remote_friendly_jobs) == 2

        # 7. Search by salary range
        high_salary_jobs = search_jobs(JobSearchFilters(salary_min=125000))
        assert len(high_salary_jobs) == 1  # Only Python job (130k) meets criteria

        # 8. Combined filters
        remote_software_jobs = search_jobs(
            JobSearchFilters(engineering_discipline=EngineeringDiscipline.SOFTWARE, remote_friendly=True)
        )
        assert len(remote_software_jobs) == 1
        assert remote_software_jobs[0].job_title == "Senior Python Engineer"

        # 9. Search with no results
        no_results = search_jobs(JobSearchFilters(keyword="NonexistentTechnology"))
        assert len(no_results) == 0

    def test_job_posting_validation_scenarios(self, new_db):
        """Test various job posting validation scenarios."""

        # Test valid job posting
        valid_job_data = JobPostingCreate(
            job_title="Software Engineer",
            company_name="Tech Corp",
            job_description="Develop software applications using modern technologies and best practices.",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="New York, NY",
            application_url="https://techcorp.com/jobs/software-engineer",
        )
        job = create_job_posting(valid_job_data)
        assert job is not None
        assert job.job_title == "Software Engineer"
        assert job.is_active

        # Test job with salary range
        job_with_salary = JobPostingCreate(
            job_title="Senior Engineer",
            company_name="Big Tech",
            job_description="Lead engineering teams and architect complex systems for large-scale applications.",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Seattle, WA",
            application_url="https://bigtech.com/careers/senior-engineer",
            salary_min=150000,
            salary_max=200000,
            remote_friendly=True,
        )
        job2 = create_job_posting(job_with_salary)
        assert job2 is not None
        assert job2.salary_min == 150000
        assert job2.salary_max == 200000
        assert job2.remote_friendly

    def test_job_search_case_insensitivity(self, new_db):
        """Test that job searches are case insensitive."""
        job_data = JobPostingCreate(
            job_title="Full Stack JavaScript Developer",
            company_name="JS Masters",
            job_description="Build modern web applications with Node.js, Express, and MongoDB.",
            engineering_discipline=EngineeringDiscipline.SOFTWARE,
            location="Portland, OR",
            application_url="https://jsmasters.com/careers/fullstack-js",
        )
        create_job_posting(job_data)

        # Test various case combinations
        search_terms = ["javascript", "JAVASCRIPT", "JavaScript", "js", "JS", "node"]

        for term in search_terms:
            results = search_jobs(JobSearchFilters(keyword=term))
            assert len(results) >= 0  # Should not error

        # Test specific case-insensitive searches
        js_results = search_jobs(JobSearchFilters(keyword="javascript"))
        assert len(js_results) == 1

        node_results = search_jobs(JobSearchFilters(keyword="node"))
        assert len(node_results) == 1

    def test_engineering_disciplines_coverage(self, new_db):
        """Test that all engineering disciplines work correctly."""
        disciplines_to_test = [
            EngineeringDiscipline.SOFTWARE,
            EngineeringDiscipline.HARDWARE,
            EngineeringDiscipline.MECHANICAL,
            EngineeringDiscipline.ELECTRICAL,
            EngineeringDiscipline.DEVOPS,
            EngineeringDiscipline.DATA,
        ]

        for i, discipline in enumerate(disciplines_to_test):
            job_data = JobPostingCreate(
                job_title=f"{discipline.value} Position {i + 1}",
                company_name=f"Company {i + 1}",
                job_description=f"Work in {discipline.value} creating innovative solutions.",
                engineering_discipline=discipline,
                location=f"City {i + 1}",
                application_url=f"https://company{i + 1}.com/job{i + 1}",
            )
            job = create_job_posting(job_data)
            assert job is not None
            assert job.engineering_discipline == discipline

        # Verify we can search by each discipline
        for discipline in disciplines_to_test:
            results = search_jobs(JobSearchFilters(engineering_discipline=discipline))
            assert len(results) == 1
            assert results[0].engineering_discipline == discipline

    def test_location_search_flexibility(self, new_db):
        """Test flexible location searching."""
        locations_data = [
            ("San Francisco, CA", "https://company1.com/job1"),
            ("New York, NY", "https://company2.com/job2"),
            ("Remote", "https://company3.com/job3"),
            ("Austin, TX (Remote OK)", "https://company4.com/job4"),
            ("Boston, Massachusetts", "https://company5.com/job5"),
        ]

        for i, (location, url) in enumerate(locations_data):
            job_data = JobPostingCreate(
                job_title=f"Engineer Position {i + 1}",
                company_name=f"Company {i + 1}",
                job_description="Generic engineering position description.",
                engineering_discipline=EngineeringDiscipline.SOFTWARE,
                location=location,
                application_url=url,
            )
            create_job_posting(job_data)

        # Test partial location searches
        ca_jobs = search_jobs(JobSearchFilters(location="CA"))
        assert len(ca_jobs) == 1

        remote_jobs = search_jobs(JobSearchFilters(location="remote"))
        assert len(remote_jobs) == 2  # "Remote" and "Austin, TX (Remote OK)"

        ny_jobs = search_jobs(JobSearchFilters(location="New York"))
        assert len(ny_jobs) == 1

        mass_jobs = search_jobs(JobSearchFilters(location="Mass"))
        assert len(mass_jobs) == 1
