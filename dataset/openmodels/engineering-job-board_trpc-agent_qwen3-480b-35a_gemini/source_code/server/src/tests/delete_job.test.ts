import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteJob } from '../handlers/delete_job';

describe('deleteJob', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should delete an existing job', async () => {
    // First, create a job directly
    const result = await db.insert(jobsTable).values({
      title: 'Software Engineer',
      description: 'Develop amazing software',
      company: 'Tech Corp',
      location: 'San Francisco',
      discipline: 'Software Engineering',
      salary_min: '80000.00',
      salary_max: '120000.00',
      is_remote: false
    }).returning().execute();
    
    const jobId = result[0].id;
    
    // Delete the job
    const deletionResult = await deleteJob(jobId);
    
    // Verify the result
    expect(deletionResult).toBe(true);
    
    // Verify the job no longer exists
    const remainingJobs = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).execute();
    expect(remainingJobs).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent job', async () => {
    const result = await deleteJob(99999); // Non-existent ID
    expect(result).toBe(false);
  });
});