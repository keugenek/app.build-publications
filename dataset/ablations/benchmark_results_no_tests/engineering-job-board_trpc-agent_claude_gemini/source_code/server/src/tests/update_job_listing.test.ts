import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type UpdateJobListingInput } from '../schema';
import { updateJobListing } from '../handlers/update_job_listing';
import { eq } from 'drizzle-orm';

// Test data for creating initial job listing
const testJobListing: CreateJobListingInput = {
  job_title: 'Software Engineer',
  company_name: 'Tech Corp',
  engineering_discipline: 'Software',
  location: 'San Francisco, CA',
  job_description: 'Develop web applications',
  application_link: 'https://techcorp.com/careers'
};

describe('updateJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a job listing with all fields', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
      })
      .returning()
      .execute();

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      job_title: 'Senior Software Engineer',
      company_name: 'Updated Tech Corp',
      engineering_discipline: 'Electrical',
      location: 'New York, NY',
      job_description: 'Lead software development',
      application_link: 'https://updated-techcorp.com/careers'
    };

    const result = await updateJobListing(updateInput);

    // Verify the update
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.job_title).toEqual('Senior Software Engineer');
    expect(result!.company_name).toEqual('Updated Tech Corp');
    expect(result!.engineering_discipline).toEqual('Electrical');
    expect(result!.location).toEqual('New York, NY');
    expect(result!.job_description).toEqual('Lead software development');
    expect(result!.application_link).toEqual('https://updated-techcorp.com/careers');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toEqual(createdJob.created_at);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
  });

  it('should update only provided fields (partial update)', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
      })
      .returning()
      .execute();

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      job_title: 'Updated Title',
      location: 'Updated Location'
    };

    const result = await updateJobListing(updateInput);

    // Verify only specified fields were updated
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.job_title).toEqual('Updated Title');
    expect(result!.location).toEqual('Updated Location');
    // These should remain unchanged
    expect(result!.company_name).toEqual(testJobListing.company_name);
    expect(result!.engineering_discipline).toEqual(testJobListing.engineering_discipline);
    expect(result!.job_description).toEqual(testJobListing.job_description);
    expect(result!.application_link).toEqual(testJobListing.application_link);
    expect(result!.created_at).toEqual(createdJob.created_at);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
  });

  it('should update job listing in database', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
      })
      .returning()
      .execute();

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      job_title: 'Database Updated Title',
      company_name: 'Database Updated Company'
    };

    await updateJobListing(updateInput);

    // Verify the database record was updated
    const dbRecord = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, createdJob.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].job_title).toEqual('Database Updated Title');
    expect(dbRecord[0].company_name).toEqual('Database Updated Company');
    expect(dbRecord[0].updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
  });

  it('should return null for non-existent job listing', async () => {
    const updateInput: UpdateJobListingInput = {
      id: 999999, // Non-existent ID
      job_title: 'Updated Title'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeNull();
  });

  it('should update engineering discipline correctly', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
        engineering_discipline: 'Software'
      })
      .returning()
      .execute();

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      engineering_discipline: 'Mechanical'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.engineering_discipline).toEqual('Mechanical');
    // Verify other fields remain unchanged
    expect(result!.job_title).toEqual(testJobListing.job_title);
    expect(result!.company_name).toEqual(testJobListing.company_name);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
      })
      .returning()
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      job_title: 'Same Title Change' // Even small change should update timestamp
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
    expect(result!.created_at).toEqual(createdJob.created_at);
  });

  it('should handle URL application link updates', async () => {
    // Create initial job listing
    const [createdJob] = await db.insert(jobListingsTable)
      .values({
        ...testJobListing,
      })
      .returning()
      .execute();

    const updateInput: UpdateJobListingInput = {
      id: createdJob.id,
      application_link: 'https://newcompany.com/apply'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.application_link).toEqual('https://newcompany.com/apply');
  });
});
