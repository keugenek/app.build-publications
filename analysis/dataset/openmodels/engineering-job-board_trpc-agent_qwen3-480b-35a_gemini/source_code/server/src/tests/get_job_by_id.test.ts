import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput } from '../schema';
import { getJobById } from '../handlers/get_job_by_id';

// Test input for creating a job
const testInput: any = {
  title: 'Software Engineer',
  description: 'Develop amazing software applications',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  discipline: 'Software Engineering' as any,
  salary_min: 100000,
  salary_max: 150000,
  is_remote: true
};

describe('getJobById', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test job to fetch
    await db.insert(jobsTable).values({
      title: testInput.title,
      description: testInput.description,
      company: testInput.company,
      location: testInput.location,
      discipline: testInput.discipline,
      salary_min: testInput.salary_min ? testInput.salary_min.toString() : null,
      salary_max: testInput.salary_max ? testInput.salary_max.toString() : null,
      is_remote: testInput.is_remote
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch a job by ID', async () => {
    const job = await getJobById(1);
    
    expect(job).not.toBeNull();
    expect(job).toBeDefined();
    
    // Check all fields match the input
    expect(job!.title).toEqual(testInput.title);
    expect(job!.description).toEqual(testInput.description);
    expect(job!.company).toEqual(testInput.company);
    expect(job!.location).toEqual(testInput.location);
    expect(job!.discipline).toEqual(testInput.discipline);
    expect(job!.is_remote).toEqual(testInput.is_remote);
    
    // Check numeric fields are properly converted
    expect(typeof job!.salary_min).toBe('number');
    expect(typeof job!.salary_max).toBe('number');
    expect(job!.salary_min).toEqual(testInput.salary_min);
    expect(job!.salary_max).toEqual(testInput.salary_max);
    
    // Check date fields
    expect(job!.created_at).toBeInstanceOf(Date);
    expect(job!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent job ID', async () => {
    const job = await getJobById(99999);
    expect(job).toBeNull();
  });

  it('should handle job with null salary fields', async () => {
    // Create a job with null salary fields
    await db.insert(jobsTable).values({
      title: 'Volunteer Position',
      description: 'Helping with open source',
      company: 'Open Source Org',
      location: 'Remote',
      discipline: 'Other' as any,
      is_remote: true
    }).execute();
    
    const job = await getJobById(2);
    
    expect(job).not.toBeNull();
    expect(job).toBeDefined();
    expect(job!.salary_min).toBeNull();
    expect(job!.salary_max).toBeNull();
  });
});