import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { getJobListings } from '../handlers/get_job_listings';

// Test data for job listings
const testJobListing1: CreateJobListingInput = {
  title: 'Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  description: 'We are looking for a skilled software engineer to join our team.',
  engineering_discipline: 'Software'
};

const testJobListing2: CreateJobListingInput = {
  title: 'Mechanical Engineer',
  company_name: 'Manufacturing Inc',
  location: 'Detroit, MI',
  description: 'Mechanical engineer position for automotive design.',
  engineering_discipline: 'Mechanical'
};

const testJobListing3: CreateJobListingInput = {
  title: 'Civil Engineer',
  company_name: 'Construction Co',
  location: 'New York, NY',
  description: 'Civil engineer for infrastructure projects.',
  engineering_discipline: 'Civil'
};

describe('getJobListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no job listings exist', async () => {
    const result = await getJobListings();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all job listings', async () => {
    // Create test job listings
    await db.insert(jobListingsTable)
      .values([testJobListing1, testJobListing2, testJobListing3])
      .execute();

    const result = await getJobListings();

    expect(result).toHaveLength(3);
    
    // Verify all job listings are returned
    const titles = result.map(job => job.title);
    expect(titles).toContain('Software Engineer');
    expect(titles).toContain('Mechanical Engineer');
    expect(titles).toContain('Civil Engineer');
  });

  it('should return job listings with all required fields', async () => {
    // Create a single test job listing
    await db.insert(jobListingsTable)
      .values(testJobListing1)
      .execute();

    const result = await getJobListings();

    expect(result).toHaveLength(1);
    const jobListing = result[0];

    // Verify all required fields are present and correct
    expect(jobListing.id).toBeDefined();
    expect(jobListing.title).toEqual('Software Engineer');
    expect(jobListing.company_name).toEqual('Tech Corp');
    expect(jobListing.location).toEqual('San Francisco, CA');
    expect(jobListing.description).toEqual('We are looking for a skilled software engineer to join our team.');
    expect(jobListing.engineering_discipline).toEqual('Software');
    expect(jobListing.created_at).toBeInstanceOf(Date);
    expect(jobListing.updated_at).toBeInstanceOf(Date);
  });

  it('should return job listings ordered by creation date (most recent first)', async () => {
    // Create job listings with slight delay to ensure different timestamps
    await db.insert(jobListingsTable)
      .values(testJobListing1)
      .execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(jobListingsTable)
      .values(testJobListing2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(jobListingsTable)
      .values(testJobListing3)
      .execute();

    const result = await getJobListings();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].title).toEqual('Civil Engineer'); // Last created
    expect(result[1].title).toEqual('Mechanical Engineer'); // Second created
    expect(result[2].title).toEqual('Software Engineer'); // First created

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle different engineering disciplines correctly', async () => {
    const disciplineTestJobs = [
      { ...testJobListing1, engineering_discipline: 'Software' as const },
      { ...testJobListing2, engineering_discipline: 'Hardware' as const, title: 'Hardware Engineer' },
      { ...testJobListing3, engineering_discipline: 'Electrical' as const, title: 'Electrical Engineer' }
    ];

    await db.insert(jobListingsTable)
      .values(disciplineTestJobs)
      .execute();

    const result = await getJobListings();

    expect(result).toHaveLength(3);
    
    const disciplines = result.map(job => job.engineering_discipline);
    expect(disciplines).toContain('Software');
    expect(disciplines).toContain('Hardware');
    expect(disciplines).toContain('Electrical');
  });

  it('should return correct data types for all fields', async () => {
    await db.insert(jobListingsTable)
      .values(testJobListing1)
      .execute();

    const result = await getJobListings();
    const jobListing = result[0];

    expect(typeof jobListing.id).toBe('number');
    expect(typeof jobListing.title).toBe('string');
    expect(typeof jobListing.company_name).toBe('string');
    expect(typeof jobListing.location).toBe('string');
    expect(typeof jobListing.description).toBe('string');
    expect(typeof jobListing.engineering_discipline).toBe('string');
    expect(jobListing.created_at).toBeInstanceOf(Date);
    expect(jobListing.updated_at).toBeInstanceOf(Date);
  });
});
