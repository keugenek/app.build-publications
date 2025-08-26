import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type JobListingFilters } from '../schema';
import { getJobListings } from '../handlers/get_job_listings';

// Test data
const testJobListing1: CreateJobListingInput = {
  job_title: 'Senior Software Engineer',
  company_name: 'TechCorp Inc',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  job_description: 'We are looking for a senior software engineer to join our team.',
  application_link: 'https://techcorp.com/apply/123'
};

const testJobListing2: CreateJobListingInput = {
  job_title: 'Electrical Engineer',
  company_name: 'ElectroTech LLC',
  engineering_discipline: 'Electrical',
  location: 'New York, NY',
  job_description: 'Design and develop electrical systems for commercial buildings.',
  application_link: 'https://electrotech.com/careers/456'
};

const testJobListing3: CreateJobListingInput = {
  job_title: 'Mechanical Design Engineer',
  company_name: 'MechWorks Ltd',
  engineering_discipline: 'Mechanical',
  location: 'San Francisco, CA',
  job_description: 'Design mechanical components for automotive applications.',
  application_link: 'https://mechworks.com/jobs/789'
};

const testJobListing4: CreateJobListingInput = {
  job_title: 'Junior Software Developer',
  company_name: 'StartupXYZ',
  engineering_discipline: 'Software',
  location: 'Austin, TX',
  job_description: 'Entry-level position for a software developer in a fast-paced startup environment.',
  application_link: 'https://startupxyz.com/apply/101'
};

describe('getJobListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all job listings when no filters are provided', async () => {
    // Create test job listings
    await db.insert(jobListingsTable).values([
      testJobListing1,
      testJobListing2,
      testJobListing3,
      testJobListing4
    ]).execute();

    const result = await getJobListings();

    expect(result).toHaveLength(4);
    
    // Verify all required fields are present
    result.forEach(job => {
      expect(job.id).toBeDefined();
      expect(job.job_title).toBeDefined();
      expect(job.company_name).toBeDefined();
      expect(job.engineering_discipline).toBeDefined();
      expect(job.location).toBeDefined();
      expect(job.job_description).toBeDefined();
      expect(job.application_link).toBeDefined();
      expect(job.created_at).toBeInstanceOf(Date);
      expect(job.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no job listings exist', async () => {
    const result = await getJobListings();
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should filter by engineering discipline', async () => {
    // Create test job listings
    await db.insert(jobListingsTable).values([
      testJobListing1, // Software
      testJobListing2, // Electrical
      testJobListing4  // Software
    ]).execute();

    const filters: JobListingFilters = {
      engineering_discipline: 'Software'
    };

    const result = await getJobListings(filters);

    expect(result).toHaveLength(2);
    result.forEach(job => {
      expect(job.engineering_discipline).toEqual('Software');
    });

    // Verify specific jobs are returned
    const jobTitles = result.map(job => job.job_title).sort();
    expect(jobTitles).toEqual(['Junior Software Developer', 'Senior Software Engineer']);
  });

  it('should filter by location using partial match', async () => {
    // Create test job listings
    await db.insert(jobListingsTable).values([
      testJobListing1, // San Francisco, CA
      testJobListing2, // New York, NY
      testJobListing3, // San Francisco, CA
      testJobListing4  // Austin, TX
    ]).execute();

    // Test partial match on "Francisco"
    const filters: JobListingFilters = {
      location: 'Francisco'
    };

    const result = await getJobListings(filters);

    expect(result).toHaveLength(2);
    result.forEach(job => {
      expect(job.location.toLowerCase()).toContain('francisco');
    });

    // Test partial match on "TX"
    const texasFilters: JobListingFilters = {
      location: 'TX'
    };

    const texasResult = await getJobListings(texasFilters);
    expect(texasResult).toHaveLength(1);
    expect(texasResult[0].location).toEqual('Austin, TX');
  });

  it('should filter by both engineering discipline and location', async () => {
    // Create test job listings
    await db.insert(jobListingsTable).values([
      testJobListing1, // Software, San Francisco, CA
      testJobListing2, // Electrical, New York, NY
      testJobListing3, // Mechanical, San Francisco, CA
      testJobListing4  // Software, Austin, TX
    ]).execute();

    const filters: JobListingFilters = {
      engineering_discipline: 'Software',
      location: 'CA'
    };

    const result = await getJobListings(filters);

    expect(result).toHaveLength(1);
    expect(result[0].job_title).toEqual('Senior Software Engineer');
    expect(result[0].engineering_discipline).toEqual('Software');
    expect(result[0].location).toContain('CA');
  });

  it('should return results ordered by created_at DESC', async () => {
    // Insert first job listing
    const firstJob = await db.insert(jobListingsTable)
      .values(testJobListing1)
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second job listing
    const secondJob = await db.insert(jobListingsTable)
      .values(testJobListing2)
      .returning()
      .execute();

    const result = await getJobListings();

    expect(result).toHaveLength(2);
    
    // Newest job (second) should come first
    expect(result[0].id).toEqual(secondJob[0].id);
    expect(result[1].id).toEqual(firstJob[0].id);
    
    // Verify ordering by timestamps
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should return empty array when filters match no records', async () => {
    // Create test job listings
    await db.insert(jobListingsTable).values([
      testJobListing1,
      testJobListing2
    ]).execute();

    const filters: JobListingFilters = {
      engineering_discipline: 'Aerospace'
    };

    const result = await getJobListings(filters);
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle case-insensitive location filtering', async () => {
    // Create test job listing
    await db.insert(jobListingsTable).values(testJobListing1).execute();

    // Test lowercase location search
    const filters: JobListingFilters = {
      location: 'san francisco'
    };

    const result = await getJobListings(filters);
    
    expect(result).toHaveLength(1);
    expect(result[0].location).toEqual('San Francisco, CA');
  });
});
