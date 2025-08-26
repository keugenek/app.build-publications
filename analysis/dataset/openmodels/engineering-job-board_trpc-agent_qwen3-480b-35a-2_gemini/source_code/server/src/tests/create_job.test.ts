import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput } from '../schema';
import { createJob } from '../handlers/create_job';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateJobInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software applications',
  discipline: 'Software Engineering',
  location: 'Remote',
  company_name: 'Tech Corp',
  application_link: 'https://techcorp.com/apply'
};

describe('createJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job', async () => {
    const result = await createJob(testInput);

    // Basic field validation
    expect(result.title).toEqual('Software Engineer');
    expect(result.description).toEqual(testInput.description);
    expect(result.discipline).toEqual('Software Engineering');
    expect(result.location).toEqual('Remote');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.application_link).toEqual('https://techcorp.com/apply');
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
    expect(jobs[0].description).toEqual(testInput.description);
    expect(jobs[0].discipline).toEqual('Software Engineering');
    expect(jobs[0].location).toEqual('Remote');
    expect(jobs[0].company_name).toEqual('Tech Corp');
    expect(jobs[0].application_link).toEqual('https://techcorp.com/apply');
    expect(jobs[0].created_at).toBeInstanceOf(Date);
    expect(jobs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different disciplines and locations', async () => {
    const input: CreateJobInput = {
      title: 'Data Scientist',
      description: 'Analyze complex datasets',
      discipline: 'Data Science',
      location: 'New York, NY',
      company_name: 'Data Inc',
      application_link: 'https://datainc.com/apply'
    };

    const result = await createJob(input);

    expect(result.discipline).toEqual('Data Science');
    expect(result.location).toEqual('New York, NY');
  });
});
