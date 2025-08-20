import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { createJobListing } from '../handlers/create_job_listing';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateJobListingInput = {
  job_title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  job_description: 'We are looking for an experienced software engineer to join our team.',
  application_link: 'https://techcorp.com/careers/senior-software-engineer'
};

describe('createJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job listing', async () => {
    const result = await createJobListing(testInput);

    // Basic field validation
    expect(result.job_title).toEqual('Senior Software Engineer');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.engineering_discipline).toEqual('Software');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.job_description).toEqual('We are looking for an experienced software engineer to join our team.');
    expect(result.application_link).toEqual('https://techcorp.com/careers/senior-software-engineer');
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
    expect(jobListings[0].job_title).toEqual('Senior Software Engineer');
    expect(jobListings[0].company_name).toEqual('Tech Corp');
    expect(jobListings[0].engineering_discipline).toEqual('Software');
    expect(jobListings[0].location).toEqual('San Francisco, CA');
    expect(jobListings[0].job_description).toEqual('We are looking for an experienced software engineer to join our team.');
    expect(jobListings[0].application_link).toEqual('https://techcorp.com/careers/senior-software-engineer');
    expect(jobListings[0].created_at).toBeInstanceOf(Date);
    expect(jobListings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create job listing with different engineering discipline', async () => {
    const mechanicalInput: CreateJobListingInput = {
      job_title: 'Mechanical Engineer',
      company_name: 'Manufacturing Inc',
      engineering_discipline: 'Mechanical',
      location: 'Detroit, MI',
      job_description: 'Design and develop mechanical systems for automotive applications.',
      application_link: 'https://manufacturing-inc.com/jobs/mechanical-engineer'
    };

    const result = await createJobListing(mechanicalInput);

    expect(result.engineering_discipline).toEqual('Mechanical');
    expect(result.job_title).toEqual('Mechanical Engineer');
    expect(result.company_name).toEqual('Manufacturing Inc');
    expect(result.location).toEqual('Detroit, MI');
  });

  it('should create multiple job listings with unique IDs', async () => {
    const input1: CreateJobListingInput = {
      ...testInput,
      job_title: 'Frontend Developer'
    };

    const input2: CreateJobListingInput = {
      ...testInput,
      job_title: 'Backend Developer',
      engineering_discipline: 'Software'
    };

    const result1 = await createJobListing(input1);
    const result2 = await createJobListing(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.job_title).toEqual('Frontend Developer');
    expect(result2.job_title).toEqual('Backend Developer');
  });

  it('should handle electrical engineering discipline', async () => {
    const electricalInput: CreateJobListingInput = {
      job_title: 'Electrical Engineer',
      company_name: 'Power Systems Ltd',
      engineering_discipline: 'Electrical',
      location: 'Houston, TX',
      job_description: 'Design electrical systems for industrial applications.',
      application_link: 'https://powersystems.com/careers/electrical-engineer'
    };

    const result = await createJobListing(electricalInput);

    expect(result.engineering_discipline).toEqual('Electrical');
    expect(result.job_title).toEqual('Electrical Engineer');
    expect(result.company_name).toEqual('Power Systems Ltd');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createJobListing(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
