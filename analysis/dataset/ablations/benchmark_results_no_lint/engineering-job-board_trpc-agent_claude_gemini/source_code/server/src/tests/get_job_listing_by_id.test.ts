import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { getJobListingById } from '../handlers/get_job_listing_by_id';

// Test job listing data
const testJobListing: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  description: 'We are looking for a senior software engineer to join our team and work on cutting-edge applications.',
  engineering_discipline: 'Software'
};

const secondJobListing: CreateJobListingInput = {
  title: 'Civil Engineer',
  company_name: 'Construction Co',
  location: 'New York, NY',
  description: 'Seeking an experienced civil engineer for infrastructure projects.',
  engineering_discipline: 'Civil'
};

describe('getJobListingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return job listing when found by ID', async () => {
    // Create a test job listing
    const insertResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = insertResult[0];

    // Fetch the job listing by ID
    const result = await getJobListingById(createdJob.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.title).toEqual('Senior Software Engineer');
    expect(result!.company_name).toEqual('Tech Corp');
    expect(result!.location).toEqual('San Francisco, CA');
    expect(result!.description).toEqual(testJobListing.description);
    expect(result!.engineering_discipline).toEqual('Software');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when job listing not found', async () => {
    // Try to fetch a non-existent job listing
    const result = await getJobListingById(999);

    expect(result).toBeNull();
  });

  it('should return correct job listing when multiple exist', async () => {
    // Create multiple job listings
    const firstInsert = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const secondInsert = await db.insert(jobListingsTable)
      .values(secondJobListing)
      .returning()
      .execute();

    const firstJob = firstInsert[0];
    const secondJob = secondInsert[0];

    // Fetch specific job listings by their IDs
    const firstResult = await getJobListingById(firstJob.id);
    const secondResult = await getJobListingById(secondJob.id);

    // Verify first job listing
    expect(firstResult).not.toBeNull();
    expect(firstResult!.id).toEqual(firstJob.id);
    expect(firstResult!.title).toEqual('Senior Software Engineer');
    expect(firstResult!.engineering_discipline).toEqual('Software');

    // Verify second job listing
    expect(secondResult).not.toBeNull();
    expect(secondResult!.id).toEqual(secondJob.id);
    expect(secondResult!.title).toEqual('Civil Engineer');
    expect(secondResult!.engineering_discipline).toEqual('Civil');
  });

  it('should handle edge case with ID 0', async () => {
    // Try to fetch job listing with ID 0
    const result = await getJobListingById(0);

    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    // Try to fetch job listing with negative ID
    const result = await getJobListingById(-1);

    expect(result).toBeNull();
  });

  it('should verify all timestamp fields are Date objects', async () => {
    // Create a test job listing
    const insertResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();

    const createdJob = insertResult[0];

    // Fetch the job listing
    const result = await getJobListingById(createdJob.id);

    // Verify timestamp fields are proper Date objects
    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBeGreaterThan(0);
    expect(result!.updated_at.getTime()).toBeGreaterThan(0);
  });
});
