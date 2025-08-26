import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type SearchJobsInput, type CreateJobListingInput } from '../schema';
import { searchJobs } from '../handlers/search_jobs';

// Helper function to create test job listings
const createTestJobListing = async (data: CreateJobListingInput) => {
  const result = await db.insert(jobListingsTable)
    .values({
      title: data.title,
      description: data.description,
      engineering_discipline: data.engineering_discipline,
      location: data.location,
      company_name: data.company_name,
      application_url: data.application_url
    })
    .returning()
    .execute();

  return result[0];
};

// Test data
const testJobListings: CreateJobListingInput[] = [
  {
    title: 'Senior Software Engineer',
    description: 'Join our team to build scalable web applications using React and Node.js',
    engineering_discipline: 'Software',
    location: 'San Francisco, CA',
    company_name: 'TechCorp Inc',
    application_url: 'https://example.com/apply/1'
  },
  {
    title: 'Electrical Engineer',
    description: 'Design and develop electrical systems for automotive applications',
    engineering_discipline: 'Electrical',
    location: 'Detroit, MI',
    company_name: 'AutoTech Solutions',
    application_url: 'https://example.com/apply/2'
  },
  {
    title: 'Full Stack Developer',
    description: 'Work on both frontend React components and backend Node.js APIs',
    engineering_discipline: 'Software',
    location: 'New York, NY',
    company_name: 'StartupXYZ',
    application_url: 'https://example.com/apply/3'
  },
  {
    title: 'Mechanical Engineer',
    description: 'Design mechanical components for aerospace industry applications',
    engineering_discipline: 'Mechanical',
    location: 'Seattle, WA',
    company_name: 'AeroSpace Corp',
    application_url: 'https://example.com/apply/4'
  },
  {
    title: 'Software Architect',
    description: 'Lead the architecture design for enterprise software solutions',
    engineering_discipline: 'Software',
    location: 'Austin, TX',
    company_name: 'Enterprise Solutions',
    application_url: 'https://example.com/apply/5'
  }
];

describe('searchJobs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all jobs when no filters are provided', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(5);
    expect(result[0].title).toBeDefined();
    expect(result[0].description).toBeDefined();
    expect(result[0].engineering_discipline).toBeDefined();
    expect(result[0].location).toBeDefined();
    expect(result[0].company_name).toBeDefined();
    expect(result[0].application_url).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should search by keyword in title (case-insensitive)', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      keyword: 'software',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(2); // "Senior Software Engineer" and "Software Architect"
    expect(result.every(job => 
      job.title.toLowerCase().includes('software') ||
      job.description.toLowerCase().includes('software')
    )).toBe(true);
  });

  it('should search by keyword in description (case-insensitive)', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      keyword: 'react',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(2); // Jobs mentioning "React" in description
    expect(result.every(job => 
      job.title.toLowerCase().includes('react') ||
      job.description.toLowerCase().includes('react')
    )).toBe(true);
  });

  it('should filter by engineering discipline', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      engineering_discipline: 'Software',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(3); // All software engineering jobs
    expect(result.every(job => job.engineering_discipline === 'Software')).toBe(true);
  });

  it('should filter by location (case-insensitive partial match)', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      location: 'CA',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(1); // Only San Francisco, CA job
    expect(result[0].location).toContain('CA');
  });

  it('should combine multiple filters', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      keyword: 'software',
      engineering_discipline: 'Software',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(2); // Software jobs with "software" in title/description
    expect(result.every(job => 
      job.engineering_discipline === 'Software' &&
      (job.title.toLowerCase().includes('software') || 
       job.description.toLowerCase().includes('software'))
    )).toBe(true);
  });

  it('should apply pagination with limit and offset', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    // Test first page
    const firstPage: SearchJobsInput = {
      limit: 2,
      offset: 0
    };

    const firstResult = await searchJobs(firstPage);
    expect(firstResult).toHaveLength(2);

    // Test second page
    const secondPage: SearchJobsInput = {
      limit: 2,
      offset: 2
    };

    const secondResult = await searchJobs(secondPage);
    expect(secondResult).toHaveLength(2);

    // Ensure different results
    expect(firstResult[0].id).not.toEqual(secondResult[0].id);
    expect(firstResult[1].id).not.toEqual(secondResult[1].id);
  });

  it('should return results ordered by creation date (newest first)', async () => {
    // Create test data with slight delays to ensure different timestamps
    const job1 = await createTestJobListing(testJobListings[0]);
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    const job2 = await createTestJobListing(testJobListings[1]);
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    const job3 = await createTestJobListing(testJobListings[2]);

    const input: SearchJobsInput = {
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(3);
    // Results should be ordered by created_at descending (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
    
    // The most recently created job should be first
    expect(result[0].id).toEqual(job3.id);
  });

  it('should return empty array when no jobs match criteria', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      keyword: 'nonexistent',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(0);
  });

  it('should handle edge case with empty keyword', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      keyword: '',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    // Empty keyword should return all results
    expect(result).toHaveLength(5);
  });

  it('should handle case-insensitive location search', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobsInput = {
      location: 'san francisco',
      limit: 20,
      offset: 0
    };

    const result = await searchJobs(input);

    expect(result).toHaveLength(1);
    expect(result[0].location.toLowerCase()).toContain('san francisco');
  });
});
