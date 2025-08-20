import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { deleteJobListing } from '../handlers/delete_job_listing';
import { eq } from 'drizzle-orm';

// Test job listing data
const testJobListing: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  description: 'Seeking an experienced software engineer to join our team',
  engineering_discipline: 'Software'
};

describe('deleteJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing job listing and return true', async () => {
    // Create a test job listing first
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: testJobListing.title,
        company_name: testJobListing.company_name,
        location: testJobListing.location,
        description: testJobListing.description,
        engineering_discipline: testJobListing.engineering_discipline
      })
      .returning({ id: jobListingsTable.id })
      .execute();

    const jobId = insertResult[0].id;

    // Delete the job listing
    const result = await deleteJobListing(jobId);

    // Should return true for successful deletion
    expect(result).toBe(true);
  });

  it('should verify job listing is actually removed from database', async () => {
    // Create a test job listing first
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: testJobListing.title,
        company_name: testJobListing.company_name,
        location: testJobListing.location,
        description: testJobListing.description,
        engineering_discipline: testJobListing.engineering_discipline
      })
      .returning({ id: jobListingsTable.id })
      .execute();

    const jobId = insertResult[0].id;

    // Verify job exists before deletion
    const beforeDeletion = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, jobId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    // Delete the job listing
    await deleteJobListing(jobId);

    // Verify job is no longer in database
    const afterDeletion = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, jobId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent job listing', async () => {
    // Try to delete a job listing that doesn't exist
    const result = await deleteJobListing(99999);

    // Should return false for non-existent job
    expect(result).toBe(false);
  });

  it('should not affect other job listings when deleting one', async () => {
    // Create multiple test job listings
    const jobListing1 = { ...testJobListing, title: 'Job 1' };
    const jobListing2 = { ...testJobListing, title: 'Job 2', engineering_discipline: 'Mechanical' as const };

    const insertResults = await db.insert(jobListingsTable)
      .values([
        {
          title: jobListing1.title,
          company_name: jobListing1.company_name,
          location: jobListing1.location,
          description: jobListing1.description,
          engineering_discipline: jobListing1.engineering_discipline
        },
        {
          title: jobListing2.title,
          company_name: jobListing2.company_name,
          location: jobListing2.location,
          description: jobListing2.description,
          engineering_discipline: jobListing2.engineering_discipline
        }
      ])
      .returning({ id: jobListingsTable.id })
      .execute();

    const job1Id = insertResults[0].id;
    const job2Id = insertResults[1].id;

    // Delete only the first job listing
    const result = await deleteJobListing(job1Id);
    expect(result).toBe(true);

    // Verify first job is deleted
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job1Id))
      .execute();

    expect(deletedJob).toHaveLength(0);

    // Verify second job still exists
    const remainingJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job2Id))
      .execute();

    expect(remainingJob).toHaveLength(1);
    expect(remainingJob[0].title).toEqual('Job 2');
    expect(remainingJob[0].engineering_discipline).toEqual('Mechanical');
  });

  it('should handle edge case with ID of 0', async () => {
    // Try to delete with ID 0 (edge case)
    const result = await deleteJobListing(0);

    // Should return false as ID 0 shouldn't exist (serial starts at 1)
    expect(result).toBe(false);
  });
});
