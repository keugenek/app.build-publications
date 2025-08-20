import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type Job } from '../schema';
import { getJobs } from '../handlers/get_jobs';
import { eq } from 'drizzle-orm';

// Helper to insert a job directly
const insertJob = async (job: Omit<Job, 'id' | 'posted_at'>) => {
  const result = await db
    .insert(jobsTable)
    .values({
      title: job.title,
      description: job.description ?? null,
      discipline: job.discipline,
      location: job.location,
      salary: job.salary !== undefined ? job.salary.toString() : null,
    })
    .returning()
    .execute();
  return result[0];
};

describe('getJobs handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no jobs exist', async () => {
    const jobs = await getJobs();
    expect(jobs).toEqual([]);
  });

  it('should fetch all jobs with correct type conversions', async () => {
    // Insert two jobs
    await insertJob({
      title: 'Software Engineer',
      description: 'Develop cool software',
      discipline: 'Software',
      location: 'Remote',
      salary: 120000,
    });
    await insertJob({
      title: 'Mechanical Engineer',
      description: null,
      discipline: 'Mechanical',
      location: 'Factory',
      // salary omitted (null)
    } as any);

    const jobs = await getJobs();
    expect(jobs).toHaveLength(2);

    const softwareJob = jobs.find(j => j.title === 'Software Engineer')!;
    expect(softwareJob.salary).toBe(120000);
    expect(typeof softwareJob.salary).toBe('number');
    expect(softwareJob.description).toBe('Develop cool software');
    expect(softwareJob.posted_at).toBeInstanceOf(Date);

    const mechanicalJob = jobs.find(j => j.title === 'Mechanical Engineer')!;
    expect(mechanicalJob.salary).toBeUndefined();
    expect(mechanicalJob.description).toBeNull();
    expect(mechanicalJob.posted_at).toBeInstanceOf(Date);
  });
});
