import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type DeleteJobInput, type CreateJobListingInput } from '../schema';
import { deleteJobListing } from '../handlers/delete_job_listing';
import { eq } from 'drizzle-orm';

// Test input for creating a job listing to delete
const testJobInput: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  description: 'Looking for an experienced software engineer to join our team.',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  company_name: 'Tech Corp',
  application_url: 'https://example.com/apply'
};

describe('deleteJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing job listing', async () => {
    // First, create a job listing
    const createResult = await db.insert(jobListingsTable)
      .values({
        title: testJobInput.title,
        description: testJobInput.description,
        engineering_discipline: testJobInput.engineering_discipline,
        location: testJobInput.location,
        company_name: testJobInput.company_name,
        application_url: testJobInput.application_url
      })
      .returning()
      .execute();

    const createdJob = createResult[0];
    expect(createdJob.id).toBeDefined();

    // Delete the job listing
    const deleteInput: DeleteJobInput = { id: createdJob.id };
    const result = await deleteJobListing(deleteInput);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the job listing no longer exists in the database
    const remainingJobs = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(remainingJobs).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent job listing', async () => {
    // Try to delete a job listing that doesn't exist
    const deleteInput: DeleteJobInput = { id: 99999 };
    const result = await deleteJobListing(deleteInput);

    // Should return false since no record was found to delete
    expect(result).toBe(false);
  });

  it('should not affect other job listings when deleting one', async () => {
    // Create multiple job listings
    const job1Result = await db.insert(jobListingsTable)
      .values({
        title: 'Software Engineer 1',
        description: 'First job description',
        engineering_discipline: 'Software',
        location: 'New York, NY',
        company_name: 'Company 1',
        application_url: 'https://company1.com/apply'
      })
      .returning()
      .execute();

    const job2Result = await db.insert(jobListingsTable)
      .values({
        title: 'Software Engineer 2',
        description: 'Second job description',
        engineering_discipline: 'Software',
        location: 'Austin, TX',
        company_name: 'Company 2',
        application_url: 'https://company2.com/apply'
      })
      .returning()
      .execute();

    const job1 = job1Result[0];
    const job2 = job2Result[0];

    // Delete only the first job
    const deleteInput: DeleteJobInput = { id: job1.id };
    const result = await deleteJobListing(deleteInput);

    expect(result).toBe(true);

    // Verify first job is deleted
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job1.id))
      .execute();

    expect(deletedJob).toHaveLength(0);

    // Verify second job still exists
    const remainingJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, job2.id))
      .execute();

    expect(remainingJob).toHaveLength(1);
    expect(remainingJob[0].title).toBe('Software Engineer 2');
  });

  it('should handle deletion of job with different engineering disciplines', async () => {
    // Create job listings with different disciplines
    const mechanicalJobResult = await db.insert(jobListingsTable)
      .values({
        title: 'Mechanical Engineer',
        description: 'Design mechanical systems',
        engineering_discipline: 'Mechanical',
        location: 'Detroit, MI',
        company_name: 'Auto Corp',
        application_url: 'https://autocorp.com/apply'
      })
      .returning()
      .execute();

    const electricalJobResult = await db.insert(jobListingsTable)
      .values({
        title: 'Electrical Engineer',
        description: 'Design electrical circuits',
        engineering_discipline: 'Electrical',
        location: 'Phoenix, AZ',
        company_name: 'Electric Co',
        application_url: 'https://electricco.com/apply'
      })
      .returning()
      .execute();

    const mechanicalJob = mechanicalJobResult[0];
    const electricalJob = electricalJobResult[0];

    // Delete the mechanical engineering job
    const deleteInput: DeleteJobInput = { id: mechanicalJob.id };
    const result = await deleteJobListing(deleteInput);

    expect(result).toBe(true);

    // Verify correct job was deleted
    const deletedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, mechanicalJob.id))
      .execute();

    expect(deletedJob).toHaveLength(0);

    // Verify electrical job still exists
    const remainingJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, electricalJob.id))
      .execute();

    expect(remainingJob).toHaveLength(1);
    expect(remainingJob[0].engineering_discipline).toBe('Electrical');
  });
});
