import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteJobListing } from '../handlers/delete_job_listing';
import { type CreateJobListingInput } from '../schema';

// Test data
const testJobInput: CreateJobListingInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software',
  discipline: 'Software Engineering',
  location: 'San Francisco, CA',
  company_name: 'Tech Corp'
};

describe('deleteJobListing', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test job listing
    await db.insert(jobListingsTable)
      .values(testJobInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing job listing', async () => {
    // First, get the ID of the job listing we just created
    const jobListings = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.company_name, 'Tech Corp'))
      .execute();
    
    expect(jobListings).toHaveLength(1);
    const jobId = jobListings[0].id;
    
    // Delete the job listing
    const result = await deleteJobListing(jobId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify the job listing no longer exists in the database
    const remainingListings = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, jobId))
      .execute();
    
    expect(remainingListings).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent job listing', async () => {
    // Try to delete a job listing that doesn't exist
    const result = await deleteJobListing(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified job listing', async () => {
    // Create another job listing
    await db.insert(jobListingsTable)
      .values({
        title: 'Data Engineer',
        description: 'Work with big data',
        discipline: 'Data Engineering',
        location: 'New York, NY',
        company_name: 'Data Corp'
      })
      .execute();
    
    // Get the ID of the first job listing
    const jobListings = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.company_name, 'Tech Corp'))
      .execute();
    
    expect(jobListings).toHaveLength(1);
    const jobId = jobListings[0].id;
    
    // Delete only the first job listing
    const result = await deleteJobListing(jobId);
    expect(result).toBe(true);
    
    // Verify only one job listing remains
    const remainingListings = await db.select().from(jobListingsTable).execute();
    expect(remainingListings).toHaveLength(1);
    expect(remainingListings[0].company_name).toBe('Data Corp');
  });
});
