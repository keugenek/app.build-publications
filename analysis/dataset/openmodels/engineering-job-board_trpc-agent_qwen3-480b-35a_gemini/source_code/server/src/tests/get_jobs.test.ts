import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput, type JobFilter } from '../schema';
import { getJobs } from '../handlers/get_jobs';

// Test job data
const testJobs: CreateJobInput[] = [
  {
    title: 'Software Engineer',
    description: 'Develop web applications',
    company: 'Tech Corp',
    location: 'San Francisco',
    discipline: 'Software Engineering',
    salary_min: 80000,
    salary_max: 120000,
    is_remote: false
  },
  {
    title: 'DevOps Engineer',
    description: 'Manage cloud infrastructure',
    company: 'Cloud Services',
    location: 'New York',
    discipline: 'DevOps',
    salary_min: 90000,
    salary_max: 130000,
    is_remote: true
  },
  {
    title: 'Data Scientist',
    description: 'Analyze big data',
    company: 'Data Insights',
    location: 'Boston',
    discipline: 'Data Science',
    salary_min: 100000,
    salary_max: 150000,
    is_remote: true
  }
];

describe('getJobs', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test jobs
    for (const job of testJobs) {
      await db.insert(jobsTable).values({
        ...job,
        salary_min: job.salary_min?.toString(),
        salary_max: job.salary_max?.toString()
      }).execute();
    }
  });

  afterEach(resetDB);

  it('should return all jobs when no filter is provided', async () => {
    const result = await getJobs();
    
    expect(result).toHaveLength(3);
    
    // Check that numeric fields are properly converted
    expect(typeof result[0].salary_min).toBe('number');
    expect(typeof result[0].salary_max).toBe('number');
    
    // Check that dates are properly converted
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter jobs by discipline', async () => {
    const filter: JobFilter = { discipline: 'DevOps' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].discipline).toBe('DevOps');
    expect(result[0].title).toBe('DevOps Engineer');
  });

  it('should filter jobs by location', async () => {
    const filter: JobFilter = { location: 'San Francisco' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].location).toBe('San Francisco');
    expect(result[0].company).toBe('Tech Corp');
  });

  it('should filter jobs by remote status', async () => {
    const filter: JobFilter = { is_remote: true };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(2);
    result.forEach(job => {
      expect(job.is_remote).toBe(true);
    });
  });

  it('should filter jobs by search term in title', async () => {
    const filter: JobFilter = { search: 'Software' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Software Engineer');
  });

  it('should filter jobs by search term in company', async () => {
    const filter: JobFilter = { search: 'Cloud' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe('Cloud Services');
  });

  it('should filter jobs by search term in description', async () => {
    const filter: JobFilter = { search: 'big data' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('big data');
  });

  it('should apply multiple filters', async () => {
    const filter: JobFilter = { 
      discipline: 'Software Engineering',
      is_remote: false
    };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(1);
    expect(result[0].discipline).toBe('Software Engineering');
    expect(result[0].is_remote).toBe(false);
  });

  it('should return empty array when no jobs match filter', async () => {
    const filter: JobFilter = { discipline: 'Mechanical Engineering' };
    const result = await getJobs(filter);
    
    expect(result).toHaveLength(0);
  });
});