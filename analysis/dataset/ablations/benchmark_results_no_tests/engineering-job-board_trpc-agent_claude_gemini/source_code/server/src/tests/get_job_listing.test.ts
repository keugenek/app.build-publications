import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type GetJobListingInput, type CreateJobListingInput } from '../schema';
import { getJobListing } from '../handlers/get_job_listing';
import { eq } from 'drizzle-orm';

// Test data for creating job listings
const testJobListing: CreateJobListingInput = {
  job_title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  job_description: 'We are looking for a senior software engineer to join our team...',
  application_link: 'https://techcorp.com/apply'
};

const testJobListing2: CreateJobListingInput = {
  job_title: 'Electrical Engineer',
  company_name: 'Power Systems Inc',
  engineering_discipline: 'Electrical',
  location: 'Austin, TX',
  job_description: 'Join our electrical engineering team working on power systems...',
  application_link: 'https://powersystems.com/careers'
};

describe('getJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a job listing by ID', async () => {
    // Create a job listing first
    const insertResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = insertResult[0];
    
    // Test getting the job listing
    const input: GetJobListingInput = { id: createdJob.id };
    const result = await getJobListing(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.job_title).toEqual('Senior Software Engineer');
    expect(result!.company_name).toEqual('Tech Corp');
    expect(result!.engineering_discipline).toEqual('Software');
    expect(result!.location).toEqual('San Francisco, CA');
    expect(result!.job_description).toEqual(testJobListing.job_description);
    expect(result!.application_link).toEqual('https://techcorp.com/apply');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when job listing does not exist', async () => {
    // Test with non-existent ID
    const input: GetJobListingInput = { id: 99999 };
    const result = await getJobListing(input);

    expect(result).toBeNull();
  });

  it('should return the correct job listing when multiple exist', async () => {
    // Create multiple job listings
    const insertResult1 = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const insertResult2 = await db.insert(jobListingsTable)
      .values(testJobListing2)
      .returning()
      .execute();

    const job1 = insertResult1[0];
    const job2 = insertResult2[0];

    // Test getting the second job listing
    const input: GetJobListingInput = { id: job2.id };
    const result = await getJobListing(input);

    // Verify it returns the correct job listing
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(job2.id);
    expect(result!.job_title).toEqual('Electrical Engineer');
    expect(result!.company_name).toEqual('Power Systems Inc');
    expect(result!.engineering_discipline).toEqual('Electrical');
    expect(result!.location).toEqual('Austin, TX');
    
    // Verify it's not the first job listing
    expect(result!.id).not.toEqual(job1.id);
    expect(result!.job_title).not.toEqual('Senior Software Engineer');
  });

  it('should handle zero as an ID', async () => {
    // Test with ID 0 (which should not exist)
    const input: GetJobListingInput = { id: 0 };
    const result = await getJobListing(input);

    expect(result).toBeNull();
  });

  it('should handle negative IDs', async () => {
    // Test with negative ID (which should not exist)
    const input: GetJobListingInput = { id: -1 };
    const result = await getJobListing(input);

    expect(result).toBeNull();
  });

  it('should verify database integrity after retrieval', async () => {
    // Create a job listing
    const insertResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = insertResult[0];
    
    // Get the job listing through handler
    const input: GetJobListingInput = { id: createdJob.id };
    const handlerResult = await getJobListing(input);

    // Verify the job still exists in database directly
    const directQuery = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.id).toEqual(directQuery[0].id);
    expect(handlerResult!.job_title).toEqual(directQuery[0].job_title);
  });
});
