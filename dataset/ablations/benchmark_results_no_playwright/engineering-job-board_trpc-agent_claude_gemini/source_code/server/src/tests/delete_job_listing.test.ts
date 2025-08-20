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
  company_name: 'TechCorp Inc',
  location: 'San Francisco, CA',
  engineering_discipline: 'Software',
  description: 'We are looking for a senior software engineer to join our team and work on cutting-edge applications.',
  requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience',
  salary_range: '$120,000 - $150,000',
  employment_type: 'Full-time',
  remote_friendly: true
};

describe('deleteJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing job listing', async () => {
    // First, create a job listing
    const createResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = createResult[0];
    expect(createdJob.id).toBeDefined();

    // Delete the job listing
    const deleteResult = await deleteJobListing(createdJob.id);

    // Should return true indicating successful deletion
    expect(deleteResult).toBe(true);
  });

  it('should verify job listing is removed from database', async () => {
    // Create a job listing
    const createResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = createResult[0];

    // Delete the job listing
    await deleteJobListing(createdJob.id);

    // Verify it's no longer in the database
    const jobsAfterDelete = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(jobsAfterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent job listing', async () => {
    // Try to delete a job listing with an ID that doesn't exist
    const nonExistentId = 99999;
    const deleteResult = await deleteJobListing(nonExistentId);

    // Should return false indicating no deletion occurred
    expect(deleteResult).toBe(false);
  });

  it('should not affect other job listings when deleting one', async () => {
    // Create two job listings
    const firstJob = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const secondJobData = {
      ...testJobListing,
      title: 'Junior Software Engineer',
      company_name: 'StartupCorp'
    };

    const secondJob = await db.insert(jobListingsTable)
      .values(secondJobData)
      .returning()
      .execute();

    // Delete the first job listing
    const deleteResult = await deleteJobListing(firstJob[0].id);
    expect(deleteResult).toBe(true);

    // Verify the second job listing still exists
    const remainingJobs = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, secondJob[0].id))
      .execute();

    expect(remainingJobs).toHaveLength(1);
    expect(remainingJobs[0].title).toBe('Junior Software Engineer');
    expect(remainingJobs[0].company_name).toBe('StartupCorp');

    // Verify the first job is gone
    const deletedJobs = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, firstJob[0].id))
      .execute();

    expect(deletedJobs).toHaveLength(0);
  });

  it('should handle deletion of job with minimal data', async () => {
    // Create a job listing with minimal required fields only
    const minimalJobData = {
      title: 'Test Position',
      company_name: 'Test Company',
      location: 'Test Location',
      engineering_discipline: 'Mechanical' as const,
      description: 'Basic test description'
      // requirements, salary_range are null (default)
      // employment_type defaults to 'Full-time'
      // remote_friendly defaults to false
    };

    const createResult = await db.insert(jobListingsTable)
      .values(minimalJobData)
      .returning()
      .execute();

    const createdJob = createResult[0];

    // Delete the minimal job listing
    const deleteResult = await deleteJobListing(createdJob.id);

    expect(deleteResult).toBe(true);

    // Verify it's deleted
    const jobsAfterDelete = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(jobsAfterDelete).toHaveLength(0);
  });
});
