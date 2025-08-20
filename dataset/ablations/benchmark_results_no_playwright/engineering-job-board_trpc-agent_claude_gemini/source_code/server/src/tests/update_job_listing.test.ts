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
  company_name: 'TechCorp Inc.',
  location: 'San Francisco, CA',
  engineering_discipline: 'Software',
  description: 'We are looking for a senior software engineer to join our team.',
  requirements: '5+ years of experience in JavaScript and React',
  salary_range: '$120,000 - $150,000',
  employment_type: 'Full-time',
  remote_friendly: false
};

// Helper function to create a job listing for testing
const createTestJobListing = async () => {
  const result = await db.insert(jobListingsTable)
    .values({
      ...testJobListing,
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
    const created = await createTestJobListing();
    const originalUpdatedAt = created.updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      title: 'Principal Software Engineer',
      company_name: 'NewTech LLC',
      location: 'Remote',
      engineering_discipline: 'Electrical',
      description: 'Updated description for the role',
      requirements: 'Updated requirements',
      salary_range: '$150,000 - $180,000',
      employment_type: 'Contract',
      remote_friendly: true
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.title).toEqual('Principal Software Engineer');
    expect(result!.company_name).toEqual('NewTech LLC');
    expect(result!.location).toEqual('Remote');
    expect(result!.engineering_discipline).toEqual('Electrical');
    expect(result!.description).toEqual('Updated description for the role');
    expect(result!.requirements).toEqual('Updated requirements');
    expect(result!.salary_range).toEqual('$150,000 - $180,000');
    expect(result!.employment_type).toEqual('Contract');
    expect(result!.remote_friendly).toEqual(true);
    expect(result!.created_at).toEqual(created.created_at);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update only specified fields', async () => {
    // Create initial job listing
    const created = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      title: 'Updated Title',
      remote_friendly: true
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.remote_friendly).toEqual(true);
    // Other fields should remain unchanged
    expect(result!.company_name).toEqual(testJobListing.company_name);
    expect(result!.location).toEqual(testJobListing.location);
    expect(result!.engineering_discipline).toEqual(testJobListing.engineering_discipline);
    expect(result!.description).toEqual(testJobListing.description);
    expect(result!.requirements).toEqual(testJobListing.requirements || null);
    expect(result!.salary_range).toEqual(testJobListing.salary_range || null);
    expect(result!.employment_type).toEqual(testJobListing.employment_type);
  });

  it('should update nullable fields to null', async () => {
    // Create initial job listing
    const created = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      requirements: null as string | null,
      salary_range: null as string | null
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.requirements).toBeNull();
    expect(result!.salary_range).toBeNull();
    // Other fields should remain unchanged
    expect(result!.title).toEqual(testJobListing.title);
    expect(result!.company_name).toEqual(testJobListing.company_name);
  });

  it('should return null for non-existent job listing', async () => {
    const updateInput: UpdateJobListingInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create initial job listing
    const created = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: created.id
      // No fields to update
    };

    const result = await updateJobListing(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create initial job listing
    const created = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      title: 'Database Test Title',
      company_name: 'Database Test Company'
    };

    await updateJobListing(updateInput);

    // Query database to verify changes were saved
    const dbRecord = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, created.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].title).toEqual('Database Test Title');
    expect(dbRecord[0].company_name).toEqual('Database Test Company');
    expect(dbRecord[0].location).toEqual(testJobListing.location); // Should remain unchanged
  });

  it('should update updated_at timestamp', async () => {
    // Create initial job listing
    const created = await createTestJobListing();
    const originalUpdatedAt = created.updated_at;

    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      title: 'Timestamp Test'
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result!.created_at).toEqual(created.created_at); // Should remain unchanged
  });

  it('should handle partial engineering discipline update', async () => {
    // Create initial job listing with Software discipline
    const created = await createTestJobListing();

    const updateInput: UpdateJobListingInput = {
      id: created.id,
      engineering_discipline: 'Mechanical'
    };

    const result = await updateJobListing(updateInput);

    expect(result).not.toBeNull();
    expect(result!.engineering_discipline).toEqual('Mechanical');
    expect(result!.title).toEqual(testJobListing.title); // Should remain unchanged
  });
});
