import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type SearchJobsInput, type Job } from '../schema';
import { searchJobs } from '../handlers/search_jobs';
import { eq } from 'drizzle-orm';

// Helper to insert a job directly into the DB
const insertJob = async (job: Omit<Job, 'id' | 'posted_at'>) => {
  const result = await db
    .insert(jobsTable)
    .values({
      title: job.title,
      description: job.description ?? undefined,
      discipline: job.discipline,
      location: job.location,
      // Salary is stored as numeric (string) in the DB
      salary: job.salary !== undefined ? job.salary.toString() : undefined,
    })
    .returning()
    .execute();
  return result[0];
};

describe('searchJobs handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all jobs when no filters are provided', async () => {
    // Insert two jobs
    await insertJob({
      title: 'Software Engineer',
      description: 'Develop software',
      discipline: 'Software',
      location: 'Remote',
      salary: 120000,
    });
    await insertJob({
      title: 'Mechanical Engineer',
      description: null,
      discipline: 'Mechanical',
      location: 'Berlin',
      // salary omitted (undefined)
    });

    const result = await searchJobs({});
    expect(result).toHaveLength(2);
    const software = result.find(j => j.discipline === 'Software');
    const mechanical = result.find(j => j.discipline === 'Mechanical');
    expect(software).toBeDefined();
    expect(software?.salary).toBe(120000);
    expect(mechanical).toBeDefined();
    expect(mechanical?.salary).toBeUndefined();
    // description null should be preserved as null
    expect(mechanical?.description).toBeNull();
  });

  it('filters by discipline correctly', async () => {
    await insertJob({
      title: 'Software Engineer',
      description: 'Develop software',
      discipline: 'Software',
      location: 'Remote',
      salary: 120000,
    });
    await insertJob({
      title: 'Mechanical Engineer',
      description: null,
      discipline: 'Mechanical',
      location: 'Berlin',
    });

    const input: SearchJobsInput = { discipline: 'Software' };
    const result = await searchJobs(input);
    expect(result).toHaveLength(1);
    expect(result[0].discipline).toBe('Software');
    expect(result[0].salary).toBe(120000);
  });

  it('filters by location correctly', async () => {
    await insertJob({
      title: 'Software Engineer',
      description: 'Develop software',
      discipline: 'Software',
      location: 'Remote',
      salary: 120000,
    });
    await insertJob({
      title: 'Mechanical Engineer',
      description: null,
      discipline: 'Mechanical',
      location: 'Berlin',
    });

    const input: SearchJobsInput = { location: 'Berlin' };
    const result = await searchJobs(input);
    expect(result).toHaveLength(1);
    expect(result[0].location).toBe('Berlin');
    expect(result[0].discipline).toBe('Mechanical');
  });
});
