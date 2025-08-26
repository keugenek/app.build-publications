import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type UpdateJobListingInput } from '../schema';
import { updateJobListing } from '../handlers/update_job_listing';
import { eq } from 'drizzle-orm';

// Test data for creating initial job listing
const testJobListing: CreateJobListingInput = {
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  description: 'We are looking for a senior software engineer...',
  engineering_discipline: 'Software'
};

describe('updateJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a job listing with all fields', async () => {
    // Create initial job listing
    const initialResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();
    
    const initialJob = initialResult[0];
    const originalUpdatedAt = initialJob.updated_at;

    // Wait a moment to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update all fields
    const updateInput: UpdateJobListingInput = {
      id: initialJob.id,
      title: 'Lead Software Engineer',
      company_name: 'New Tech Corp',
      location: 'New York, NY',
      description: 'Updated job description for lead position...',
      engineering_discipline: 'Hardware'
    };

    const result = await updateJobListing(updateInput);

    // Verify updated fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(initialJob.id);
    expect(result!.title).toEqual('Lead Software Engineer');
    expect(result!.company_name).toEqual('New Tech Corp');
    expect(result!.location).toEqual('New York, NY');
    expect(result!.description).toEqual('Updated job description for lead position...');
    expect(result!.engineering_discipline).toEqual('Hardware');
    expect(result!.created_at).toEqual(initialJob.created_at);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should update partial fields only', async () => {
    // Create initial job listing
    const initialResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();
    
    const initialJob = initialResult[0];

    // Update only title and location
    const updateInput: UpdateJobListingInput = {
      id: initialJob.id,
      title: 'Principal Software Engineer',
      location: 'Austin, TX'
    };

    const result = await updateJobListing(updateInput);

    // Verify only specified fields were updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(initialJob.id);
    expect(result!.title).toEqual('Principal Software Engineer');
    expect(result!.company_name).toEqual(testJobListing.company_name); // Should remain unchanged
    expect(result!.location).toEqual('Austin, TX');
    expect(result!.description).toEqual(testJobListing.description); // Should remain unchanged
    expect(result!.engineering_discipline).toEqual(testJobListing.engineering_discipline); // Should remain unchanged
    expect(result!.created_at).toEqual(initialJob.created_at);
    expect(result!.updated_at > initialJob.updated_at).toBe(true);
  });

  it('should return null when job listing does not exist', async () => {
    const updateInput: UpdateJobListingInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeNull();
  });

  it('should return existing record when no fields to update', async () => {
    // Create initial job listing
    const initialResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();
    
    const initialJob = initialResult[0];

    // Update with no fields (just ID)
    const updateInput: UpdateJobListingInput = {
      id: initialJob.id
    };

    const result = await updateJobListing(updateInput);

    // Should return existing record unchanged
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(initialJob.id);
    expect(result!.title).toEqual(initialJob.title);
    expect(result!.company_name).toEqual(initialJob.company_name);
    expect(result!.location).toEqual(initialJob.location);
    expect(result!.description).toEqual(initialJob.description);
    expect(result!.engineering_discipline).toEqual(initialJob.engineering_discipline);
    expect(result!.created_at).toEqual(initialJob.created_at);
    expect(result!.updated_at).toEqual(initialJob.updated_at); // Should not change
  });

  it('should save changes to database', async () => {
    // Create initial job listing
    const initialResult = await db.insert(jobListingsTable)
      .values(testJobListing)
      .returning()
      .execute();
    
    const initialJob = initialResult[0];

    // Update the job listing
    const updateInput: UpdateJobListingInput = {
      id: initialJob.id,
      title: 'Database Updated Title',
      engineering_discipline: 'Civil'
    };

    await updateJobListing(updateInput);

    // Verify changes are persisted in database
    const dbResult = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, initialJob.id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].title).toEqual('Database Updated Title');
    expect(dbResult[0].engineering_discipline).toEqual('Civil');
    expect(dbResult[0].company_name).toEqual(testJobListing.company_name); // Should remain unchanged
  });

  it('should update engineering discipline correctly', async () => {
    // Create initial job listing
    const initialResult = await db.insert(jobListingsTable)
      .values({...testJobListing, engineering_discipline: 'Software'})
      .returning()
      .execute();
    
    const initialJob = initialResult[0];

    // Update to different engineering discipline
    const updateInput: UpdateJobListingInput = {
      id: initialJob.id,
      engineering_discipline: 'Mechanical'
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.engineering_discipline).toEqual('Mechanical');
    expect(result!.title).toEqual(testJobListing.title); // Should remain unchanged
  });
});
