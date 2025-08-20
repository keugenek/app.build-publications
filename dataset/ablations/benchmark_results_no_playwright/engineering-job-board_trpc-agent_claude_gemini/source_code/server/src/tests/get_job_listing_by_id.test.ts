import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { getJobListingById } from '../handlers/get_job_listing_by_id';
import { type CreateJobListingInput } from '../schema';

// Test job listing data
const testJobListing: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  engineering_discipline: 'Software',
  description: 'We are looking for a senior software engineer to join our team and work on exciting projects.',
  requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience',
  salary_range: '$120,000 - $150,000',
  employment_type: 'Full-time',
  remote_friendly: true
};

const testJobListingMinimal: CreateJobListingInput = {
  title: 'Mechanical Engineer',
  company_name: 'Manufacturing Inc',
  location: 'Detroit, MI',
  engineering_discipline: 'Mechanical',
  description: 'Entry level mechanical engineer position with growth opportunities.',
  requirements: null,
  salary_range: null,
  employment_type: 'Full-time',
  remote_friendly: false
};

describe('getJobListingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return job listing when found', async () => {
    // Create a test job listing
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: testJobListing.title,
        company_name: testJobListing.company_name,
        location: testJobListing.location,
        engineering_discipline: testJobListing.engineering_discipline,
        description: testJobListing.description,
        requirements: testJobListing.requirements,
        salary_range: testJobListing.salary_range,
        employment_type: testJobListing.employment_type,
        remote_friendly: testJobListing.remote_friendly
      })
      .returning()
      .execute();

    const createdJob = insertResult[0];
    
    // Test the handler
    const result = await getJobListingById(createdJob.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.title).toBe('Senior Software Engineer');
    expect(result!.company_name).toBe('Tech Corp');
    expect(result!.location).toBe('San Francisco, CA');
    expect(result!.engineering_discipline).toBe('Software');
    expect(result!.description).toBe('We are looking for a senior software engineer to join our team and work on exciting projects.');
    expect(result!.requirements).toBe('Bachelor\'s degree in Computer Science, 5+ years experience');
    expect(result!.salary_range).toBe('$120,000 - $150,000');
    expect(result!.employment_type).toBe('Full-time');
    expect(result!.remote_friendly).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle job listing with null fields correctly', async () => {
    // Create a minimal job listing with null fields
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: testJobListingMinimal.title,
        company_name: testJobListingMinimal.company_name,
        location: testJobListingMinimal.location,
        engineering_discipline: testJobListingMinimal.engineering_discipline,
        description: testJobListingMinimal.description,
        requirements: testJobListingMinimal.requirements,
        salary_range: testJobListingMinimal.salary_range,
        employment_type: testJobListingMinimal.employment_type,
        remote_friendly: testJobListingMinimal.remote_friendly
      })
      .returning()
      .execute();

    const createdJob = insertResult[0];
    
    // Test the handler
    const result = await getJobListingById(createdJob.id);

    // Verify the result handles nulls correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.title).toBe('Mechanical Engineer');
    expect(result!.company_name).toBe('Manufacturing Inc');
    expect(result!.requirements).toBeNull();
    expect(result!.salary_range).toBeNull();
    expect(result!.remote_friendly).toBe(false);
  });

  it('should return null when job listing is not found', async () => {
    const nonExistentId = 99999;
    
    const result = await getJobListingById(nonExistentId);

    expect(result).toBeNull();
  });

  it('should handle different engineering disciplines', async () => {
    // Test with different engineering disciplines
    const disciplines = ['Electrical', 'Civil', 'Chemical'] as const;
    
    for (const discipline of disciplines) {
      const insertResult = await db.insert(jobListingsTable)
        .values({
          title: `${discipline} Engineer`,
          company_name: 'Test Company',
          location: 'Test City',
          engineering_discipline: discipline,
          description: `Looking for a ${discipline.toLowerCase()} engineer`,
          employment_type: 'Full-time',
          remote_friendly: false
        })
        .returning()
        .execute();

      const createdJob = insertResult[0];
      const result = await getJobListingById(createdJob.id);

      expect(result).not.toBeNull();
      expect(result!.engineering_discipline).toBe(discipline);
      expect(result!.title).toBe(`${discipline} Engineer`);
    }
  });

  it('should return job with correct timestamp types', async () => {
    // Create a job listing
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: 'Test Engineer',
        company_name: 'Test Company',
        location: 'Test Location',
        engineering_discipline: 'Software',
        description: 'Test description for timestamp validation',
        employment_type: 'Contract',
        remote_friendly: true
      })
      .returning()
      .execute();

    const createdJob = insertResult[0];
    const result = await getJobListingById(createdJob.id);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBeGreaterThan(0);
    expect(result!.updated_at.getTime()).toBeGreaterThan(0);
  });

  it('should handle invalid ID gracefully', async () => {
    // Test with invalid ID types (should be handled by TypeScript, but test edge cases)
    const result1 = await getJobListingById(0);
    const result2 = await getJobListingById(-1);

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});
