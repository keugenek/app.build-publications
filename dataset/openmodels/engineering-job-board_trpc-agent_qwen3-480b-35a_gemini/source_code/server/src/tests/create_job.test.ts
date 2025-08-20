import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput } from '../schema';
import { createJob } from '../handlers/create_job';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateJobInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software applications',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  discipline: 'Software Engineering',
  salary_min: 90000,
  salary_max: 120000,
  is_remote: false
};

describe('createJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job with all fields', async () => {
    const result = await createJob(testInput);

    // Basic field validation
    expect(result.title).toEqual('Software Engineer');
    expect(result.description).toEqual('Develop amazing software applications');
    expect(result.company).toEqual('Tech Corp');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.discipline).toEqual('Software Engineering');
    expect(result.salary_min).toEqual(90000);
    expect(result.salary_max).toEqual(120000);
    expect(result.is_remote).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job with minimal fields', async () => {
    const result = await createJob({
      title: 'Junior Developer',
      description: 'Entry level position',
      company: 'Startup Inc',
      location: 'New York, NY',
      discipline: 'Software Engineering' as const,
      is_remote: false
    });

    // Basic field validation
    expect(result.title).toEqual('Junior Developer');
    expect(result.description).toEqual('Entry level position');
    expect(result.company).toEqual('Startup Inc');
    expect(result.location).toEqual('New York, NY');
    expect(result.discipline).toEqual('Software Engineering');
    expect(result.salary_min).toBeNull();
    expect(result.salary_max).toBeNull();
    expect(result.is_remote).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save job to database', async () => {
    const result = await createJob(testInput);

    // Query using proper drizzle syntax
    const jobs = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toEqual('Software Engineer');
    expect(jobs[0].description).toEqual('Develop amazing software applications');
    expect(jobs[0].company).toEqual('Tech Corp');
    expect(jobs[0].location).toEqual('San Francisco, CA');
    expect(jobs[0].discipline).toEqual('Software Engineering');
    expect(jobs[0].salary_min).toEqual('90000.00'); // Stored as string in DB
    expect(jobs[0].salary_max).toEqual('120000.00'); // Stored as string in DB
    expect(jobs[0].is_remote).toEqual(false);
    expect(jobs[0].created_at).toBeInstanceOf(Date);
    expect(jobs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle remote job correctly', async () => {
    const result = await createJob({
      title: 'Remote Software Engineer',
      description: 'Develop amazing software applications remotely',
      company: 'Tech Corp',
      location: 'Remote',
      discipline: 'Software Engineering' as const,
      salary_min: 90000,
      salary_max: 120000,
      is_remote: true
    });
    
    expect(result.is_remote).toEqual(true);

    // Verify in database
    const jobs = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].is_remote).toEqual(true);
  });

  it('should handle nullable salary fields', async () => {
    const result = await createJob({
      title: 'Volunteer Position',
      description: 'Help with open source projects',
      company: 'OSS Foundation',
      location: 'Remote',
      discipline: 'Software Engineering' as const,
      is_remote: true
    });
    
    expect(result.salary_min).toBeNull();
    expect(result.salary_max).toBeNull();

    // Verify in database
    const jobs = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].salary_min).toBeNull();
    expect(jobs[0].salary_max).toBeNull();
  });
});