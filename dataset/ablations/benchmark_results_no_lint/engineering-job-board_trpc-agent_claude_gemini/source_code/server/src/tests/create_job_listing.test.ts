import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { createJobListing } from '../handlers/create_job_listing';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Solutions Inc',
  location: 'San Francisco, CA',
  description: 'We are looking for an experienced software engineer to join our team and work on cutting-edge web applications.',
  engineering_discipline: 'Software'
};

const testInputHardware: CreateJobListingInput = {
  title: 'Hardware Design Engineer',
  company_name: 'Electronics Corp',
  location: 'Austin, TX',
  description: 'Design and develop innovative hardware solutions for consumer electronics.',
  engineering_discipline: 'Hardware'
};

describe('createJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job listing with software discipline', async () => {
    const result = await createJobListing(testInput);

    // Basic field validation
    expect(result.title).toEqual('Senior Software Engineer');
    expect(result.company_name).toEqual('Tech Solutions Inc');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.description).toEqual(testInput.description);
    expect(result.engineering_discipline).toEqual('Software');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job listing with hardware discipline', async () => {
    const result = await createJobListing(testInputHardware);

    expect(result.title).toEqual('Hardware Design Engineer');
    expect(result.company_name).toEqual('Electronics Corp');
    expect(result.location).toEqual('Austin, TX');
    expect(result.engineering_discipline).toEqual('Hardware');
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
    const savedJobListing = jobListings[0];
    expect(savedJobListing.title).toEqual('Senior Software Engineer');
    expect(savedJobListing.company_name).toEqual('Tech Solutions Inc');
    expect(savedJobListing.location).toEqual('San Francisco, CA');
    expect(savedJobListing.description).toEqual(testInput.description);
    expect(savedJobListing.engineering_discipline).toEqual('Software');
    expect(savedJobListing.created_at).toBeInstanceOf(Date);
    expect(savedJobListing.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple job listings with unique IDs', async () => {
    const result1 = await createJobListing(testInput);
    const result2 = await createJobListing(testInputHardware);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Senior Software Engineer');
    expect(result2.title).toEqual('Hardware Design Engineer');

    // Verify both are in database
    const allJobListings = await db.select()
      .from(jobListingsTable)
      .execute();

    expect(allJobListings).toHaveLength(2);
    
    const titles = allJobListings.map(job => job.title);
    expect(titles).toContain('Senior Software Engineer');
    expect(titles).toContain('Hardware Design Engineer');
  });

  it('should handle different engineering disciplines correctly', async () => {
    const civilEngineerInput: CreateJobListingInput = {
      title: 'Civil Engineer',
      company_name: 'Construction Co',
      location: 'Denver, CO',
      description: 'Design infrastructure projects including bridges and highways.',
      engineering_discipline: 'Civil'
    };

    const result = await createJobListing(civilEngineerInput);

    expect(result.engineering_discipline).toEqual('Civil');
    expect(result.title).toEqual('Civil Engineer');
    expect(result.company_name).toEqual('Construction Co');

    // Verify in database
    const savedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, result.id))
      .execute();

    expect(savedJob[0].engineering_discipline).toEqual('Civil');
  });

  it('should set timestamps automatically', async () => {
    const beforeCreation = new Date();
    const result = await createJobListing(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Both timestamps should be very close to each other for new records
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});
