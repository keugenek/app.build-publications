import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type UpdateJobInput } from '../schema';
import { updateJob } from '../handlers/update_job';
import { eq } from 'drizzle-orm';

describe('updateJob', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a job directly in the database for testing
    await db.insert(jobsTable).values({
      title: 'Test Job',
      description: 'A job for testing',
      company: 'Test Company',
      location: 'Test Location',
      discipline: 'Software Engineering',
      salary_min: '50000',
      salary_max: '100000',
      is_remote: false
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update a job with partial data', async () => {
    // First, let's get the job we just created
    const jobs = await db.select().from(jobsTable).execute();
    const jobId = jobs[0].id;
    
    const updateInput: UpdateJobInput = {
      id: jobId,
      title: 'Updated Job Title',
      is_remote: true
    };

    const result = await updateJob(updateInput);

    // Basic field validation
    expect(result.id).toEqual(jobId);
    expect(result.title).toEqual('Updated Job Title');
    expect(result.description).toEqual('A job for testing');
    expect(result.company).toEqual('Test Company');
    expect(result.location).toEqual('Test Location');
    expect(result.discipline).toEqual('Software Engineering');
    expect(result.salary_min).toEqual(50000);
    expect(result.salary_max).toEqual(100000);
    expect(result.is_remote).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update salary fields correctly', async () => {
    const jobs = await db.select().from(jobsTable).execute();
    const jobId = jobs[0].id;
    
    const updateInput: UpdateJobInput = {
      id: jobId,
      salary_min: 60000,
      salary_max: 120000
    };

    const result = await updateJob(updateInput);

    expect(result.salary_min).toEqual(60000);
    expect(result.salary_max).toEqual(120000);
    expect(typeof result.salary_min).toBe('number');
    expect(typeof result.salary_max).toBe('number');
  });

  it('should set salary fields to null when provided as null', async () => {
    const jobs = await db.select().from(jobsTable).execute();
    const jobId = jobs[0].id;
    
    const updateInput: UpdateJobInput = {
      id: jobId,
      salary_min: null as any,
      salary_max: null as any
    };

    const result = await updateJob(updateInput);

    expect(result.salary_min).toBeNull();
    expect(result.salary_max).toBeNull();
  });

  it('should save updated job to database', async () => {
    const jobs = await db.select().from(jobsTable).execute();
    const jobId = jobs[0].id;
    
    const updateInput: UpdateJobInput = {
      id: jobId,
      title: 'Database Updated Job',
      description: 'Job updated via database test'
    };

    const result = await updateJob(updateInput);

    // Query using proper drizzle syntax
    const updatedJobs = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.id, jobId))
      .execute();

    expect(updatedJobs).toHaveLength(1);
    expect(updatedJobs[0].title).toEqual('Database Updated Job');
    expect(updatedJobs[0].description).toEqual('Job updated via database test');
    expect(parseFloat(updatedJobs[0].salary_min!)).toEqual(50000);
    expect(parseFloat(updatedJobs[0].salary_max!)).toEqual(100000);
    expect(updatedJobs[0].updated_at).toBeInstanceOf(Date);
    expect(updatedJobs[0].updated_at.getTime()).toBeGreaterThanOrEqual(updatedJobs[0].created_at.getTime());
  });

  it('should throw an error when trying to update a non-existent job', async () => {
    const updateInput: UpdateJobInput = {
      id: 99999,
      title: 'Non-existent Job'
    };

    await expect(updateJob(updateInput)).rejects.toThrow(/Job with id 99999 not found/);
  });
});