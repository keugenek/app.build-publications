import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type SearchJobListingsInput, type CreateJobListingInput } from '../schema';
import { searchJobListings } from '../handlers/search_job_listings';

// Helper function to create test job listings
const createTestJobListing = async (data: CreateJobListingInput) => {
  const result = await db.insert(jobListingsTable)
    .values({
      title: data.title,
      company_name: data.company_name,
      location: data.location,
      description: data.description,
      engineering_discipline: data.engineering_discipline
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test data
const testJobListings: CreateJobListingInput[] = [
  {
    title: 'Senior Software Engineer',
    company_name: 'TechCorp',
    location: 'San Francisco, CA',
    description: 'Build scalable web applications using React and Node.js',
    engineering_discipline: 'Software'
  },
  {
    title: 'Hardware Design Engineer',
    company_name: 'ChipMaker Inc',
    location: 'Austin, TX',
    description: 'Design and develop cutting-edge semiconductor devices',
    engineering_discipline: 'Hardware'
  },
  {
    title: 'Civil Engineer',
    company_name: 'BuildCo',
    location: 'New York, NY',
    description: 'Plan and oversee construction of bridges and infrastructure',
    engineering_discipline: 'Civil'
  },
  {
    title: 'Software Architect',
    company_name: 'DataSoft',
    location: 'San Francisco, CA',
    description: 'Design enterprise software architecture and lead development teams',
    engineering_discipline: 'Software'
  },
  {
    title: 'Mechanical Engineer',
    company_name: 'AutoParts LLC',
    location: 'Detroit, MI',
    description: 'Develop automotive components and systems for electric vehicles',
    engineering_discipline: 'Mechanical'
  }
];

describe('searchJobListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all job listings when no filters are provided', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {};
    const results = await searchJobListings(input);

    expect(results).toHaveLength(5);
    
    // Verify results are ordered by creation date (most recent first)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }
  });

  it('should filter by engineering discipline exactly', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {
      engineering_discipline: 'Software'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.engineering_discipline).toEqual('Software');
    });
  });

  it('should filter by location with case-insensitive partial matching', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {
      location: 'san francisco'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.location.toLowerCase()).toContain('san francisco');
    });
  });

  it('should search by term in title, company name, and description', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    // Search for term in title
    const titleSearch: SearchJobListingsInput = {
      search_term: 'architect'
    };
    
    let results = await searchJobListings(titleSearch);
    expect(results).toHaveLength(1);
    expect(results[0].title.toLowerCase()).toContain('architect');

    // Search for term in company name
    const companySearch: SearchJobListingsInput = {
      search_term: 'techcorp'
    };
    
    results = await searchJobListings(companySearch);
    expect(results).toHaveLength(1);
    expect(results[0].company_name.toLowerCase()).toContain('techcorp');

    // Search for term in description
    const descriptionSearch: SearchJobListingsInput = {
      search_term: 'semiconductor'
    };
    
    results = await searchJobListings(descriptionSearch);
    expect(results).toHaveLength(1);
    expect(results[0].description.toLowerCase()).toContain('semiconductor');
  });

  it('should perform case-insensitive search', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {
      search_term: 'REACT'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(1);
    expect(results[0].description.toLowerCase()).toContain('react');
  });

  it('should combine multiple filters with AND logic', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {
      engineering_discipline: 'Software',
      location: 'San Francisco',
      search_term: 'Senior'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(1);
    expect(results[0].engineering_discipline).toEqual('Software');
    expect(results[0].location).toContain('San Francisco');
    expect(results[0].title).toContain('Senior');
  });

  it('should return empty array when no matches found', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    const input: SearchJobListingsInput = {
      engineering_discipline: 'Biomedical'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(0);
  });

  it('should handle partial location matches correctly', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    // Search for state abbreviation
    const input: SearchJobListingsInput = {
      location: 'CA'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.location).toContain('CA');
    });
  });

  it('should search across multiple fields with search_term', async () => {
    // Create test data
    for (const jobData of testJobListings) {
      await createTestJobListing(jobData);
    }

    // Search for term that appears in different fields across different records
    const input: SearchJobListingsInput = {
      search_term: 'design'
    };
    
    const results = await searchJobListings(input);

    expect(results.length).toBeGreaterThan(0);
    
    // Verify each result contains the search term somewhere
    results.forEach(job => {
      const searchFields = [
        job.title.toLowerCase(),
        job.company_name.toLowerCase(),
        job.description.toLowerCase()
      ];
      
      const containsSearchTerm = searchFields.some(field => 
        field.includes('design')
      );
      
      expect(containsSearchTerm).toBe(true);
    });
  });

  it('should maintain proper date ordering when filtering', async () => {
    // Create test data with small delays to ensure different timestamps
    const softwareJobs = testJobListings.filter(job => job.engineering_discipline === 'Software');
    
    for (let i = 0; i < softwareJobs.length; i++) {
      await createTestJobListing(softwareJobs[i]);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const input: SearchJobListingsInput = {
      engineering_discipline: 'Software'
    };
    
    const results = await searchJobListings(input);

    expect(results).toHaveLength(2);
    
    // Verify results are ordered by creation date (most recent first)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }
  });
});
