import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { createJobListing } from '../handlers/create_job_listing';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  engineering_discipline: 'Software',
  description: 'We are looking for a senior software engineer to join our team. Must have experience with TypeScript and React.',
  requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience',
  salary_range: '$120,000 - $160,000',
  employment_type: 'Full-time',
  remote_friendly: true
};

// Minimal test input with only required fields
const minimalInput: CreateJobListingInput = {
  title: 'Junior Civil Engineer',
  company_name: 'Infrastructure Inc',
  location: 'Austin, TX',
  engineering_discipline: 'Civil',
  description: 'Entry-level position for civil engineering graduate.',
  employment_type: 'Full-time',
  remote_friendly: false
};

describe('createJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job listing with all fields', async () => {
    const result = await createJobListing(testInput);

    // Basic field validation
    expect(result.title).toEqual('Senior Software Engineer');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.engineering_discipline).toEqual('Software');
    expect(result.description).toEqual(testInput.description);
    expect(result.requirements).toEqual('Bachelor\'s degree in Computer Science, 5+ years experience');
    expect(result.salary_range).toEqual('$120,000 - $160,000');
    expect(result.employment_type).toEqual('Full-time');
    expect(result.remote_friendly).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job listing with minimal required fields', async () => {
    const result = await createJobListing(minimalInput);

    // Basic field validation
    expect(result.title).toEqual('Junior Civil Engineer');
    expect(result.company_name).toEqual('Infrastructure Inc');
    expect(result.location).toEqual('Austin, TX');
    expect(result.engineering_discipline).toEqual('Civil');
    expect(result.description).toEqual('Entry-level position for civil engineering graduate.');
    expect(result.requirements).toBeNull();
    expect(result.salary_range).toBeNull();
    expect(result.employment_type).toEqual('Full-time'); // Default value
    expect(result.remote_friendly).toEqual(false); // Default value
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
    expect(jobListings[0].title).toEqual('Senior Software Engineer');
    expect(jobListings[0].company_name).toEqual('Tech Corp');
    expect(jobListings[0].location).toEqual('San Francisco, CA');
    expect(jobListings[0].engineering_discipline).toEqual('Software');
    expect(jobListings[0].description).toEqual(testInput.description);
    expect(jobListings[0].requirements).toEqual('Bachelor\'s degree in Computer Science, 5+ years experience');
    expect(jobListings[0].salary_range).toEqual('$120,000 - $160,000');
    expect(jobListings[0].employment_type).toEqual('Full-time');
    expect(jobListings[0].remote_friendly).toEqual(true);
    expect(jobListings[0].created_at).toBeInstanceOf(Date);
    expect(jobListings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different engineering disciplines', async () => {
    const mechanicalJob: CreateJobListingInput = {
      title: 'Mechanical Design Engineer',
      company_name: 'Manufacturing Co',
      location: 'Detroit, MI',
      engineering_discipline: 'Mechanical',
      description: 'Design and develop mechanical systems for automotive applications.',
      employment_type: 'Contract',
      remote_friendly: false
    };

    const result = await createJobListing(mechanicalJob);

    expect(result.engineering_discipline).toEqual('Mechanical');
    expect(result.employment_type).toEqual('Contract');
    expect(result.remote_friendly).toEqual(false);
  });

  it('should handle null optional fields correctly', async () => {
    const jobWithNulls: CreateJobListingInput = {
      title: 'Environmental Engineer',
      company_name: 'Green Solutions',
      location: 'Seattle, WA',
      engineering_discipline: 'Environmental',
      description: 'Work on environmental remediation projects.',
      requirements: null,
      salary_range: null,
      employment_type: 'Full-time',
      remote_friendly: false
    };

    const result = await createJobListing(jobWithNulls);

    expect(result.requirements).toBeNull();
    expect(result.salary_range).toBeNull();
    expect(result.employment_type).toEqual('Full-time'); // Should use default
    expect(result.remote_friendly).toEqual(false); // Should use default
  });

  it('should create multiple job listings independently', async () => {
    const job1 = await createJobListing(testInput);
    const job2 = await createJobListing(minimalInput);

    expect(job1.id).not.toEqual(job2.id);
    expect(job1.title).toEqual('Senior Software Engineer');
    expect(job2.title).toEqual('Junior Civil Engineer');

    // Verify both are in database
    const allJobs = await db.select()
      .from(jobListingsTable)
      .execute();

    expect(allJobs).toHaveLength(2);
  });
});
