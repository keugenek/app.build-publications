import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type GetJobByIdInput, type CreateJobListingInput } from '../schema';
import { getJobById } from '../handlers/get_job_by_id';

// Test data for creating a job listing
const testJobData: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  description: 'We are looking for an experienced software engineer to join our team and work on cutting-edge applications.',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  company_name: 'TechCorp Inc.',
  application_url: 'https://example.com/apply'
};

// Additional test job data
const testJobData2: CreateJobListingInput = {
  title: 'Mechanical Design Engineer',
  description: 'Design and develop mechanical systems for automotive applications.',
  engineering_discipline: 'Mechanical',
  location: 'Detroit, MI',
  company_name: 'AutoMech Solutions',
  application_url: 'https://automech.com/careers'
};

describe('getJobById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return job listing when ID exists', async () => {
    // Create a job listing first
    const insertResult = await db.insert(jobListingsTable)
      .values({
        title: testJobData.title,
        description: testJobData.description,
        engineering_discipline: testJobData.engineering_discipline,
        location: testJobData.location,
        company_name: testJobData.company_name,
        application_url: testJobData.application_url
      })
      .returning()
      .execute();

    const createdJob = insertResult[0];

    // Test the handler
    const input: GetJobByIdInput = { id: createdJob.id };
    const result = await getJobById(input);

    // Verify the result
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.title).toBe(testJobData.title);
    expect(result!.description).toBe(testJobData.description);
    expect(result!.engineering_discipline).toBe(testJobData.engineering_discipline);
    expect(result!.location).toBe(testJobData.location);
    expect(result!.company_name).toBe(testJobData.company_name);
    expect(result!.application_url).toBe(testJobData.application_url);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    // Test with a non-existent ID
    const input: GetJobByIdInput = { id: 99999 };
    const result = await getJobById(input);

    expect(result).toBeNull();
  });

  it('should return correct job when multiple jobs exist', async () => {
    // Create multiple job listings
    const insertResult1 = await db.insert(jobListingsTable)
      .values({
        title: testJobData.title,
        description: testJobData.description,
        engineering_discipline: testJobData.engineering_discipline,
        location: testJobData.location,
        company_name: testJobData.company_name,
        application_url: testJobData.application_url
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(jobListingsTable)
      .values({
        title: testJobData2.title,
        description: testJobData2.description,
        engineering_discipline: testJobData2.engineering_discipline,
        location: testJobData2.location,
        company_name: testJobData2.company_name,
        application_url: testJobData2.application_url
      })
      .returning()
      .execute();

    const job1 = insertResult1[0];
    const job2 = insertResult2[0];

    // Test fetching the first job
    const input1: GetJobByIdInput = { id: job1.id };
    const result1 = await getJobById(input1);

    expect(result1).toBeDefined();
    expect(result1!.id).toBe(job1.id);
    expect(result1!.title).toBe(testJobData.title);
    expect(result1!.engineering_discipline).toBe('Software');

    // Test fetching the second job
    const input2: GetJobByIdInput = { id: job2.id };
    const result2 = await getJobById(input2);

    expect(result2).toBeDefined();
    expect(result2!.id).toBe(job2.id);
    expect(result2!.title).toBe(testJobData2.title);
    expect(result2!.engineering_discipline).toBe('Mechanical');
  });

  it('should handle negative ID numbers', async () => {
    // Test with a negative ID
    const input: GetJobByIdInput = { id: -1 };
    const result = await getJobById(input);

    expect(result).toBeNull();
  });

  it('should return job with all engineering disciplines', async () => {
    // Test with different engineering disciplines
    const disciplines = ['Electrical', 'Civil', 'Chemical', 'Aerospace'] as const;
    const createdJobs = [];

    // Create jobs with different disciplines
    for (const discipline of disciplines) {
      const insertResult = await db.insert(jobListingsTable)
        .values({
          title: `${discipline} Engineer`,
          description: `Job for ${discipline} engineering`,
          engineering_discipline: discipline,
          location: 'Various Locations',
          company_name: 'Engineering Corp',
          application_url: 'https://example.com/apply'
        })
        .returning()
        .execute();

      createdJobs.push(insertResult[0]);
    }

    // Verify each job can be retrieved correctly
    for (let i = 0; i < createdJobs.length; i++) {
      const job = createdJobs[i];
      const discipline = disciplines[i];

      const input: GetJobByIdInput = { id: job.id };
      const result = await getJobById(input);

      expect(result).toBeDefined();
      expect(result!.id).toBe(job.id);
      expect(result!.engineering_discipline).toBe(discipline);
      expect(result!.title).toBe(`${discipline} Engineer`);
    }
  });
});
