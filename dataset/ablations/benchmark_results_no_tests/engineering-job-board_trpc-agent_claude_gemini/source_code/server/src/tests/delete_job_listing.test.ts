import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteJobListingInput, type CreateJobListingInput } from '../schema';
import { deleteJobListing } from '../handlers/delete_job_listing';

// Test data for creating job listings
const testJobListing: CreateJobListingInput = {
  job_title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  job_description: 'Develop and maintain web applications using modern technologies.',
  application_link: 'https://techcorp.com/jobs/senior-software-engineer'
};

const createTestJobListing = async () => {
  const result = await db.insert(jobListingsTable)
    .values(testJobListing)
    .returning()
    .execute();
  return result[0];
};

describe('deleteJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing job listing', async () => {
    // Create a test job listing
    const createdJob = await createTestJobListing();
    
    const input: DeleteJobListingInput = {
      id: createdJob.id
    };

    // Delete the job listing
    const result = await deleteJobListing(input);

    // Should return success: true
    expect(result.success).toBe(true);

    // Verify the job listing is actually deleted from the database
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(deletedJob).toHaveLength(0);
  });

  it('should return success: false for non-existent job listing', async () => {
    const input: DeleteJobListingInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteJobListing(input);

    // Should return success: false for non-existent job
    expect(result.success).toBe(false);
  });

  it('should not affect other job listings when deleting one', async () => {
    // Create multiple test job listings
    const job1 = await createTestJobListing();
    
    const job2Data = {
      ...testJobListing,
      job_title: 'Electrical Engineer',
      engineering_discipline: 'Electrical' as const
    };
    const job2 = await db.insert(jobListingsTable)
      .values(job2Data)
      .returning()
      .execute();

    // Delete only the first job listing
    const input: DeleteJobListingInput = {
      id: job1.id
    };

    const result = await deleteJobListing(input);
    expect(result.success).toBe(true);

    // Verify first job is deleted
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job1.id))
      .execute();
    expect(deletedJob).toHaveLength(0);

    // Verify second job still exists
    const remainingJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job2[0].id))
      .execute();
    expect(remainingJob).toHaveLength(1);
    expect(remainingJob[0].job_title).toBe('Electrical Engineer');
  });

  it('should handle deletion with different job disciplines', async () => {
    // Create job listings with different disciplines
    const softwareJob = await createTestJobListing();
    
    const mechanicalJobData = {
      ...testJobListing,
      job_title: 'Mechanical Engineer',
      engineering_discipline: 'Mechanical' as const,
      company_name: 'Mech Corp'
    };
    const mechanicalJob = await db.insert(jobListingsTable)
      .values(mechanicalJobData)
      .returning()
      .execute();

    // Delete the mechanical engineering job
    const input: DeleteJobListingInput = {
      id: mechanicalJob[0].id
    };

    const result = await deleteJobListing(input);
    expect(result.success).toBe(true);

    // Verify mechanical job is deleted
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, mechanicalJob[0].id))
      .execute();
    expect(deletedJob).toHaveLength(0);

    // Verify software job still exists
    const remainingSoftwareJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, softwareJob.id))
      .execute();
    expect(remainingSoftwareJob).toHaveLength(1);
    expect(remainingSoftwareJob[0].engineering_discipline).toBe('Software');
  });

  it('should handle zero as a valid ID parameter', async () => {
    // Test with ID 0 (which won't exist but is a valid number)
    const input: DeleteJobListingInput = {
      id: 0
    };

    const result = await deleteJobListing(input);

    // Should return success: false for non-existent ID
    expect(result.success).toBe(false);
  });
});
