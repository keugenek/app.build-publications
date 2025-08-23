import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { createJobListing } from '../handlers/create_job_listing';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateJobListingInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software applications',
  discipline: 'Software Engineering',
  location: 'San Francisco, CA',
  company_name: 'Tech Corp'
};

describe('createJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job listing', async () => {
    const result = await createJobListing(testInput);

    // Basic field validation
    expect(result.title).toEqual('Software Engineer');
    expect(result.description).toEqual(testInput.description);
    expect(result.discipline).toEqual('Software Engineering');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save job listing to database', async () => {
    const result = await createJobListing(testInput);

    // Query using proper drizzle syntax
    const jobListings = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, result.id))
      .execute();

    expect(jobListings).toHaveLength(1);
    expect(jobListings[0].title).toEqual('Software Engineer');
    expect(jobListings[0].description).toEqual(testInput.description);
    expect(jobListings[0].discipline).toEqual('Software Engineering');
    expect(jobListings[0].location).toEqual('San Francisco, CA');
    expect(jobListings[0].company_name).toEqual('Tech Corp');
    expect(jobListings[0].created_at).toBeInstanceOf(Date);
    expect(jobListings[0].updated_at).toBeInstanceOf(Date);
  });
});
