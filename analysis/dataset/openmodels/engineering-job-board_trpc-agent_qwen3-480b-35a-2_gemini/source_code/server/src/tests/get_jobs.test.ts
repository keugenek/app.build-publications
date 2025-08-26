import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput, type FilterJobsInput } from '../schema';
import { getJobs } from '../handlers/get_jobs';
import { eq } from 'drizzle-orm';

// Test data
const softwareJob: CreateJobInput = {
  title: 'Software Engineer',
  description: 'Develop amazing software',
  discipline: 'Software Engineering',
  location: 'Remote',
  company_name: 'Tech Corp',
  application_link: 'https://techcorp.com/apply'
};

const dataScienceJob: CreateJobInput = {
  title: 'Data Scientist',
  description: 'Analyze complex data',
  discipline: 'Data Science',
  location: 'San Francisco, CA',
  company_name: 'Data Inc',
  application_link: 'https://datainc.com/apply'
};

const remoteDevOpsJob: CreateJobInput = {
  title: 'DevOps Engineer',
  description: 'Manage infrastructure',
  discipline: 'DevOps',
  location: 'Remote',
  company_name: 'Cloud Systems',
  application_link: 'https://cloudsystems.com/apply'
};

describe('getJobs', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(jobsTable).values(softwareJob).execute();
    await db.insert(jobsTable).values(dataScienceJob).execute();
    await db.insert(jobsTable).values(remoteDevOpsJob).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all jobs when no filters provided', async () => {
    const results = await getJobs();
    
    expect(results).toHaveLength(3);
    
    // Check that all expected jobs are returned
    const jobTitles = results.map(job => job.title);
    expect(jobTitles).toContain('Software Engineer');
    expect(jobTitles).toContain('Data Scientist');
    expect(jobTitles).toContain('DevOps Engineer');
    
    // Verify job structure
    const job = results[0];
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('title');
    expect(job).toHaveProperty('description');
    expect(job).toHaveProperty('discipline');
    expect(job).toHaveProperty('location');
    expect(job).toHaveProperty('company_name');
    expect(job).toHaveProperty('application_link');
    expect(job).toHaveProperty('created_at');
    expect(job).toHaveProperty('updated_at');
  });

  it('should filter jobs by discipline', async () => {
    const filters: FilterJobsInput = { discipline: 'Software Engineering' };
    const results = await getJobs(filters);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Software Engineer');
    expect(results[0].discipline).toEqual('Software Engineering');
  });

  it('should filter jobs by location', async () => {
    const filters: FilterJobsInput = { location: 'Remote' };
    const results = await getJobs(filters);
    
    expect(results).toHaveLength(2);
    
    const jobTitles = results.map(job => job.title);
    expect(jobTitles).toContain('Software Engineer');
    expect(jobTitles).toContain('DevOps Engineer');
    
    results.forEach(job => {
      expect(job.location).toEqual('Remote');
    });
  });

  it('should filter jobs by both discipline and location', async () => {
    const filters: FilterJobsInput = { 
      discipline: 'DevOps',
      location: 'Remote'
    };
    const results = await getJobs(filters);
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('DevOps Engineer');
    expect(results[0].discipline).toEqual('DevOps');
    expect(results[0].location).toEqual('Remote');
  });

  it('should return empty array when no jobs match filters', async () => {
    const filters: FilterJobsInput = { 
      discipline: 'Machine Learning',
      location: 'Boston, MA'
    };
    const results = await getJobs(filters);
    
    expect(results).toHaveLength(0);
  });

  it('should handle filters with no matches', async () => {
    const filters: FilterJobsInput = { discipline: 'QA Engineering' };
    const results = await getJobs(filters);
    
    expect(results).toHaveLength(0);
  });

  it('should preserve job data integrity', async () => {
    const results = await getJobs();
    
    const softwareEngineer = results.find(job => job.title === 'Software Engineer');
    expect(softwareEngineer).toBeDefined();
    
    if (softwareEngineer) {
      expect(softwareEngineer.title).toEqual(softwareJob.title);
      expect(softwareEngineer.description).toEqual(softwareJob.description);
      expect(softwareEngineer.discipline).toEqual(softwareJob.discipline);
      expect(softwareEngineer.location).toEqual(softwareJob.location);
      expect(softwareEngineer.company_name).toEqual(softwareJob.company_name);
      expect(softwareEngineer.application_link).toEqual(softwareJob.application_link);
      expect(softwareEngineer.created_at).toBeInstanceOf(Date);
      expect(softwareEngineer.updated_at).toBeInstanceOf(Date);
    }
  });
});
