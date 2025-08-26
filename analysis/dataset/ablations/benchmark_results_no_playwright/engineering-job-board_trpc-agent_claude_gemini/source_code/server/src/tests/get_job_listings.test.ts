import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type GetJobListingsInput } from '../schema';
import { getJobListings } from '../handlers/get_job_listings';

// Test data for job listings
const testJobListings = [
  {
    title: 'Senior Software Engineer',
    company_name: 'Tech Corp',
    location: 'San Francisco, CA',
    engineering_discipline: 'Software' as const,
    description: 'Build scalable web applications using React and Node.js',
    requirements: 'Bachelor degree in Computer Science, 5+ years experience',
    salary_range: '$120,000 - $180,000',
    employment_type: 'Full-time',
    remote_friendly: true
  },
  {
    title: 'Electrical Engineer',
    company_name: 'PowerTech Solutions',
    location: 'Austin, TX',
    engineering_discipline: 'Electrical' as const,
    description: 'Design and test electrical systems for renewable energy projects',
    requirements: 'PE license preferred, 3+ years in power systems',
    salary_range: '$80,000 - $120,000',
    employment_type: 'Full-time',
    remote_friendly: false
  },
  {
    title: 'Mechanical Engineer',
    company_name: 'Manufacturing Inc',
    location: 'Detroit, MI',
    engineering_discipline: 'Mechanical' as const,
    description: 'Develop mechanical components for automotive applications',
    requirements: null,
    salary_range: null,
    employment_type: 'Contract',
    remote_friendly: false
  },
  {
    title: 'Remote Software Developer',
    company_name: 'Digital Agency',
    location: 'Remote',
    engineering_discipline: 'Software' as const,
    description: 'Frontend development with modern JavaScript frameworks',
    requirements: '2+ years JavaScript experience',
    salary_range: '$70,000 - $100,000',
    employment_type: 'Full-time',
    remote_friendly: true
  },
  {
    title: 'Civil Engineer',
    company_name: 'Infrastructure Corp',
    location: 'New York, NY',
    engineering_discipline: 'Civil' as const,
    description: 'Design and oversee construction of bridges and roads',
    requirements: 'Professional Engineer license required',
    salary_range: '$90,000 - $130,000',
    employment_type: 'Part-time',
    remote_friendly: false
  }
];

describe('getJobListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test data before each test
  beforeEach(async () => {
    await db.insert(jobListingsTable).values(testJobListings).execute();
  });

  it('should return all job listings with default pagination', async () => {
    const input: GetJobListingsInput = {
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(5);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(1);

    // Verify ordering (most recent first by created_at)
    const titles = result.data.map(job => job.title);
    expect(titles).toContain('Senior Software Engineer');
    expect(titles).toContain('Civil Engineer');
  });

  it('should filter by engineering discipline', async () => {
    const input: GetJobListingsInput = {
      engineering_discipline: 'Software',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);

    result.data.forEach(job => {
      expect(job.engineering_discipline).toBe('Software');
    });

    const titles = result.data.map(job => job.title);
    expect(titles).toContain('Senior Software Engineer');
    expect(titles).toContain('Remote Software Developer');
  });

  it('should filter by location with partial match', async () => {
    const input: GetJobListingsInput = {
      location: 'CA',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].title).toBe('Senior Software Engineer');
    expect(result.data[0].location).toBe('San Francisco, CA');
  });

  it('should filter by remote friendly status', async () => {
    const input: GetJobListingsInput = {
      remote_friendly: true,
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);

    result.data.forEach(job => {
      expect(job.remote_friendly).toBe(true);
    });

    const titles = result.data.map(job => job.title);
    expect(titles).toContain('Senior Software Engineer');
    expect(titles).toContain('Remote Software Developer');
  });

  it('should filter by employment type', async () => {
    const input: GetJobListingsInput = {
      employment_type: 'Contract',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].title).toBe('Mechanical Engineer');
    expect(result.data[0].employment_type).toBe('Contract');
  });

  it('should search across title, company, and description', async () => {
    const input: GetJobListingsInput = {
      search_query: 'JavaScript',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].title).toBe('Remote Software Developer');
  });

  it('should search by company name', async () => {
    const input: GetJobListingsInput = {
      search_query: 'Tech Corp',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].company_name).toBe('Tech Corp');
  });

  it('should search by job title', async () => {
    const input: GetJobListingsInput = {
      search_query: 'electrical',
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].title).toBe('Electrical Engineer');
  });

  it('should combine multiple filters', async () => {
    const input: GetJobListingsInput = {
      engineering_discipline: 'Software',
      remote_friendly: true,
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);

    result.data.forEach(job => {
      expect(job.engineering_discipline).toBe('Software');
      expect(job.remote_friendly).toBe(true);
    });
  });

  it('should handle pagination correctly', async () => {
    const input: GetJobListingsInput = {
      page: 1,
      limit: 2
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('should handle second page of pagination', async () => {
    const input: GetJobListingsInput = {
      page: 2,
      limit: 2
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('should handle last page with fewer items', async () => {
    const input: GetJobListingsInput = {
      page: 3,
      limit: 2
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1); // Only 1 item on the last page
    expect(result.pagination.page).toBe(3);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('should return empty results when no matches found', async () => {
    const input: GetJobListingsInput = {
      engineering_discipline: 'Aerospace', // No aerospace jobs in test data
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(0);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('should handle case-insensitive search', async () => {
    const input: GetJobListingsInput = {
      search_query: 'TECH CORP', // Uppercase search
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].company_name).toBe('Tech Corp');
  });

  it('should handle empty search query by returning all results', async () => {
    const input: GetJobListingsInput = {
      search_query: '', // Empty string
      page: 1,
      limit: 20
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(5); // All job listings
    expect(result.pagination.total).toBe(5);
  });

  it('should correctly calculate pagination for exact division', async () => {
    // Create exactly 4 jobs with limit of 2 should give us 2 pages
    await db.delete(jobListingsTable).execute();
    
    const exactJobs = testJobListings.slice(0, 4);
    await db.insert(jobListingsTable).values(exactJobs).execute();

    const input: GetJobListingsInput = {
      page: 1,
      limit: 2
    };

    const result = await getJobListings(input);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(4);
    expect(result.pagination.totalPages).toBe(2);
  });
});
