import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type FilterJobListingsInput } from '../schema';
import { getJobListings } from '../handlers/get_job_listings';
import { eq } from 'drizzle-orm';

// Sample test data
const softwareJob: CreateJobListingInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software applications',
  discipline: 'Software Engineering',
  location: 'San Francisco, CA',
  company_name: 'Tech Corp'
};

const dataEngineerJob: CreateJobListingInput = {
  title: 'Data Engineer',
  description: 'Build data pipelines and warehouses',
  discipline: 'Data Engineering',
  location: 'New York, NY',
  company_name: 'Data Inc'
};

const remoteSoftwareJob: CreateJobListingInput = {
  title: 'Remote Software Engineer',
  description: 'Work remotely on web applications',
  discipline: 'Software Engineering',
  location: 'Remote',
  company_name: 'Remote First Co'
};

describe('getJobListings', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(jobListingsTable).values(softwareJob).execute();
    await db.insert(jobListingsTable).values(dataEngineerJob).execute();
    await db.insert(jobListingsTable).values(remoteSoftwareJob).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all job listings when no filters provided', async () => {
    const results = await getJobListings();
    
    expect(results).toHaveLength(3);
    
    // Check that all required fields are present
    results.forEach(job => {
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('description');
      expect(job).toHaveProperty('discipline');
      expect(job).toHaveProperty('location');
      expect(job).toHaveProperty('company_name');
      expect(job).toHaveProperty('created_at');
      expect(job).toHaveProperty('updated_at');
      
      expect(job.created_at).toBeInstanceOf(Date);
      expect(job.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter job listings by discipline', async () => {
    const filters: FilterJobListingsInput = { discipline: 'Software Engineering' };
    const results = await getJobListings(filters);
    
    expect(results).toHaveLength(2);
    
    results.forEach(job => {
      expect(job.discipline).toBe('Software Engineering');
    });
  });

  it('should filter job listings by location', async () => {
    const filters: FilterJobListingsInput = { location: 'Remote' };
    const results = await getJobListings(filters);
    
    expect(results).toHaveLength(1);
    expect(results[0].location).toBe('Remote');
    expect(results[0].title).toBe('Remote Software Engineer');
  });

  it('should filter job listings by both discipline and location', async () => {
    const filters: FilterJobListingsInput = { 
      discipline: 'Software Engineering',
      location: 'San Francisco, CA'
    };
    const results = await getJobListings(filters);
    
    expect(results).toHaveLength(1);
    expect(results[0].discipline).toBe('Software Engineering');
    expect(results[0].location).toBe('San Francisco, CA');
    expect(results[0].title).toBe('Software Engineer');
  });

  it('should return empty array when no jobs match filters', async () => {
    const filters: FilterJobListingsInput = { 
      discipline: 'Software Engineering',
      location: 'Non-existent Location'
    };
    const results = await getJobListings(filters);
    
    expect(results).toHaveLength(0);
  });
});
