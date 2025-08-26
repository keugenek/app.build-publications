import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { createJobListing } from '../handlers/create_job_listing';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer to join our team.',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  company_name: 'Tech Corp',
  application_url: 'https://techcorp.com/apply'
};

describe('createJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job listing', async () => {
    const result = await createJobListing(testInput);

    // Basic field validation
    expect(result.title).toEqual('Senior Software Engineer');
    expect(result.description).toEqual(testInput.description);
    expect(result.engineering_discipline).toEqual('Software');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.application_url).toEqual('https://techcorp.com/apply');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
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
    expect(jobListings[0].title).toEqual('Senior Software Engineer');
    expect(jobListings[0].description).toEqual(testInput.description);
    expect(jobListings[0].engineering_discipline).toEqual('Software');
    expect(jobListings[0].location).toEqual('San Francisco, CA');
    expect(jobListings[0].company_name).toEqual('Tech Corp');
    expect(jobListings[0].application_url).toEqual('https://techcorp.com/apply');
    expect(jobListings[0].created_at).toBeInstanceOf(Date);
    expect(jobListings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create job listing with different engineering discipline', async () => {
    const mechanicalJobInput: CreateJobListingInput = {
      title: 'Mechanical Engineer',
      description: 'Design and develop mechanical systems.',
      engineering_discipline: 'Mechanical',
      location: 'Detroit, MI',
      company_name: 'Auto Manufacturer',
      application_url: 'https://automanufacturer.com/jobs/mechanical'
    };

    const result = await createJobListing(mechanicalJobInput);

    expect(result.title).toEqual('Mechanical Engineer');
    expect(result.engineering_discipline).toEqual('Mechanical');
    expect(result.location).toEqual('Detroit, MI');
    expect(result.company_name).toEqual('Auto Manufacturer');
    expect(result.id).toBeDefined();
  });

  it('should create job listing with aerospace discipline', async () => {
    const aerospaceJobInput: CreateJobListingInput = {
      title: 'Aerospace Engineer',
      description: 'Work on next-generation aircraft design.',
      engineering_discipline: 'Aerospace',
      location: 'Seattle, WA',
      company_name: 'AeroSpace Inc',
      application_url: 'https://aerospace-inc.com/careers/engineer'
    };

    const result = await createJobListing(aerospaceJobInput);

    expect(result.engineering_discipline).toEqual('Aerospace');
    expect(result.title).toEqual('Aerospace Engineer');
    expect(result.company_name).toEqual('AeroSpace Inc');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set created_at and updated_at timestamps automatically', async () => {
    const beforeCreate = new Date();
    
    const result = await createJobListing(testInput);
    
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should create multiple job listings independently', async () => {
    const job1 = await createJobListing(testInput);
    
    const job2Input: CreateJobListingInput = {
      title: 'Civil Engineer',
      description: 'Infrastructure development and management.',
      engineering_discipline: 'Civil',
      location: 'Chicago, IL',
      company_name: 'Construction Co',
      application_url: 'https://constructionco.com/apply'
    };
    
    const job2 = await createJobListing(job2Input);

    // Verify they have different IDs
    expect(job1.id).not.toEqual(job2.id);
    
    // Verify they both exist in database
    const allJobs = await db.select()
      .from(jobListingsTable)
      .execute();

    expect(allJobs).toHaveLength(2);
    
    const job1FromDb = allJobs.find(job => job.id === job1.id);
    const job2FromDb = allJobs.find(job => job.id === job2.id);
    
    expect(job1FromDb).toBeDefined();
    expect(job2FromDb).toBeDefined();
    expect(job1FromDb!.engineering_discipline).toEqual('Software');
    expect(job2FromDb!.engineering_discipline).toEqual('Civil');
  });
});
