import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput } from '../schema';
import { getAllJobs } from '../handlers/get_all_jobs';

// Test data for job listings
const testJob1: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  description: 'Develop scalable web applications using modern technologies',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  company_name: 'TechCorp Inc',
  application_url: 'https://techcorp.com/careers/senior-engineer'
};

const testJob2: CreateJobListingInput = {
  title: 'Mechanical Design Engineer',
  description: 'Design and develop mechanical systems for automotive applications',
  engineering_discipline: 'Mechanical',
  location: 'Detroit, MI',
  company_name: 'AutoMakers LLC',
  application_url: 'https://automakers.com/jobs/mech-engineer'
};

const testJob3: CreateJobListingInput = {
  title: 'Civil Infrastructure Engineer',
  description: 'Plan and oversee construction of bridges and highways',
  engineering_discipline: 'Civil',
  location: 'Austin, TX',
  company_name: 'Infrastructure Solutions',
  application_url: 'https://infrasolutions.com/careers/civil-eng'
};

describe('getAllJobs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no jobs exist', async () => {
    const result = await getAllJobs();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all jobs when jobs exist', async () => {
    // Insert test jobs directly into database
    await db.insert(jobListingsTable)
      .values([testJob1, testJob2, testJob3])
      .execute();

    const result = await getAllJobs();

    expect(result).toHaveLength(3);
    
    // Verify all jobs are returned with correct fields
    const titles = result.map(job => job.title);
    expect(titles).toContain('Senior Software Engineer');
    expect(titles).toContain('Mechanical Design Engineer');
    expect(titles).toContain('Civil Infrastructure Engineer');

    // Verify complete job structure
    result.forEach(job => {
      expect(job.id).toBeDefined();
      expect(job.title).toBeDefined();
      expect(job.description).toBeDefined();
      expect(job.engineering_discipline).toBeDefined();
      expect(job.location).toBeDefined();
      expect(job.company_name).toBeDefined();
      expect(job.application_url).toBeDefined();
      expect(job.created_at).toBeInstanceOf(Date);
      expect(job.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return jobs ordered by creation date (newest first)', async () => {
    // Insert first job
    await db.insert(jobListingsTable)
      .values(testJob1)
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second job (should be newer)
    await db.insert(jobListingsTable)
      .values(testJob2)
      .execute();

    // Wait again
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert third job (should be newest)
    await db.insert(jobListingsTable)
      .values(testJob3)
      .execute();

    const result = await getAllJobs();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].title).toEqual('Civil Infrastructure Engineer'); // Last inserted
    expect(result[1].title).toEqual('Mechanical Design Engineer'); // Second inserted
    expect(result[2].title).toEqual('Senior Software Engineer'); // First inserted

    // Verify timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should handle single job correctly', async () => {
    // Insert single job
    await db.insert(jobListingsTable)
      .values(testJob1)
      .execute();

    const result = await getAllJobs();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Senior Software Engineer');
    expect(result[0].description).toEqual(testJob1.description);
    expect(result[0].engineering_discipline).toEqual('Software');
    expect(result[0].location).toEqual('San Francisco, CA');
    expect(result[0].company_name).toEqual('TechCorp Inc');
    expect(result[0].application_url).toEqual(testJob1.application_url);
  });

  it('should handle multiple disciplines correctly', async () => {
    // Insert jobs with different disciplines
    const electricalJob: CreateJobListingInput = {
      title: 'Electrical Systems Engineer',
      description: 'Design electrical systems for renewable energy projects',
      engineering_discipline: 'Electrical',
      location: 'Phoenix, AZ',
      company_name: 'GreenEnergy Corp',
      application_url: 'https://greenenergy.com/jobs/electrical'
    };

    const biomedicalJob: CreateJobListingInput = {
      title: 'Biomedical Device Engineer',
      description: 'Develop medical devices and equipment',
      engineering_discipline: 'Biomedical',
      location: 'Boston, MA',
      company_name: 'MedTech Innovations',
      application_url: 'https://medtech.com/careers/biomedical'
    };

    await db.insert(jobListingsTable)
      .values([electricalJob, biomedicalJob])
      .execute();

    const result = await getAllJobs();

    expect(result).toHaveLength(2);
    
    const disciplines = result.map(job => job.engineering_discipline);
    expect(disciplines).toContain('Electrical');
    expect(disciplines).toContain('Biomedical');
  });
});
