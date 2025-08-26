import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type UpdateJobListingInput } from '../schema';
import { updateJobListing } from '../handlers/update_job_listing';
import { eq } from 'drizzle-orm';

// Helper function to create a test job listing
const createTestJobListing = async (overrides: Partial<CreateJobListingInput> = {}) => {
  const defaultJobData: CreateJobListingInput = {
    title: 'Software Engineer',
    description: 'Looking for a talented software engineer to join our team',
    engineering_discipline: 'Software',
    location: 'San Francisco, CA',
    company_name: 'Tech Corp',
    application_url: 'https://example.com/apply'
  };

  const jobData = { ...defaultJobData, ...overrides };

  const result = await db.insert(jobListingsTable)
    .values({
      ...jobData,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a job listing with all fields', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing();
    const originalUpdatedAt = originalJob.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: originalJob.id,
      title: 'Senior Software Engineer',
      description: 'Looking for a senior software engineer with 5+ years experience',
      engineering_discipline: 'Electrical',
      location: 'New York, NY',
      company_name: 'Updated Tech Corp',
      application_url: 'https://newtechcorp.com/apply'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(originalJob.id);
    expect(result!.title).toEqual('Senior Software Engineer');
    expect(result!.description).toEqual('Looking for a senior software engineer with 5+ years experience');
    expect(result!.engineering_discipline).toEqual('Electrical');
    expect(result!.location).toEqual('New York, NY');
    expect(result!.company_name).toEqual('Updated Tech Corp');
    expect(result!.application_url).toEqual('https://newtechcorp.com/apply');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
    expect(result!.created_at).toEqual(originalJob.created_at);
  });

  it('should update a job listing with partial fields', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing();
    const originalUpdatedAt = originalJob.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: originalJob.id,
      title: 'Updated Software Engineer',
      location: 'Austin, TX'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(originalJob.id);
    expect(result!.title).toEqual('Updated Software Engineer');
    expect(result!.description).toEqual(originalJob.description); // Should remain unchanged
    expect(result!.engineering_discipline).toEqual(originalJob.engineering_discipline); // Should remain unchanged
    expect(result!.location).toEqual('Austin, TX');
    expect(result!.company_name).toEqual(originalJob.company_name); // Should remain unchanged
    expect(result!.application_url).toEqual(originalJob.application_url); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
    expect(result!.created_at).toEqual(originalJob.created_at);
  });

  it('should update the database record', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: originalJob.id,
      title: 'Database Updated Title',
      engineering_discipline: 'Mechanical'
    };

    await updateJobListing(updateInput);

    // Query the database to verify the update
    const updatedJobInDb = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, originalJob.id))
      .execute();

    expect(updatedJobInDb).toHaveLength(1);
    expect(updatedJobInDb[0].title).toEqual('Database Updated Title');
    expect(updatedJobInDb[0].engineering_discipline).toEqual('Mechanical');
    expect(updatedJobInDb[0].description).toEqual(originalJob.description); // Should remain unchanged
    expect(updatedJobInDb[0].updated_at).toBeInstanceOf(Date);
    expect(updatedJobInDb[0].updated_at > originalJob.updated_at).toBe(true);
  });

  it('should return null for non-existent job listing', async () => {
    const updateInput: UpdateJobListingInput = {
      id: 99999,
      title: 'Non-existent Job Update'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty update (no fields to update)', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: originalJob.id
      // No other fields provided
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(originalJob.id);
    expect(result!.title).toEqual(originalJob.title);
    expect(result!.description).toEqual(originalJob.description);
    expect(result!.engineering_discipline).toEqual(originalJob.engineering_discipline);
    expect(result!.location).toEqual(originalJob.location);
    expect(result!.company_name).toEqual(originalJob.company_name);
    expect(result!.application_url).toEqual(originalJob.application_url);
    // For empty updates, we don't modify the updated_at timestamp
    expect(result!.updated_at).toEqual(originalJob.updated_at);
    expect(result!.created_at).toEqual(originalJob.created_at);
  });

  it('should update different engineering disciplines correctly', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing({
      engineering_discipline: 'Software'
    });

    const disciplines = ['Electrical', 'Mechanical', 'Civil', 'Chemical', 'Aerospace'] as const;

    for (const discipline of disciplines) {
      const updateInput: UpdateJobListingInput = {
        id: originalJob.id,
        engineering_discipline: discipline
      };

      const result = await updateJobListing(updateInput);

      expect(result).toBeDefined();
      expect(result!.engineering_discipline).toEqual(discipline);
    }
  });

  it('should preserve created_at timestamp', async () => {
    // Create initial job listing
    const originalJob = await createTestJobListing();
    const originalCreatedAt = originalJob.created_at;

    // Wait to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: originalJob.id,
      title: 'Updated Title'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeDefined();
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at > originalCreatedAt).toBe(true);
  });
});
