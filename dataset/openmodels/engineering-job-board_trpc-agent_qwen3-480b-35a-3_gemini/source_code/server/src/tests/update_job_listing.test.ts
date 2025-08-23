import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type UpdateJobListingInput } from '../schema';
import { updateJobListing } from '../handlers/update_job_listing';
import { eq } from 'drizzle-orm';

// Helper function to create a job listing for testing
const createTestJobListing = async () => {
  const testInput: CreateJobListingInput = {
    title: 'Software Engineer',
    description: 'Develop amazing software',
    discipline: 'Software Engineering',
    location: 'San Francisco, CA',
    company_name: 'Tech Corp'
  };
  
  // Insert directly into DB for testing
  const result = await db.insert(jobListingsTable)
    .values(testInput)
    .returning()
    .execute();
    
  return result[0];
};

describe('updateJobListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a job listing with partial data', async () => {
    // Create a job listing first
    const jobListing = await createTestJobListing();
    
    // Update only the title
    const updateInput: UpdateJobListingInput = {
      id: jobListing.id,
      title: 'Senior Software Engineer'
    };
    
    const result = await updateJobListing(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(jobListing.id);
    expect(result!.title).toEqual('Senior Software Engineer');
    // Other fields should remain unchanged
    expect(result!.description).toEqual(jobListing.description);
    expect(result!.discipline).toEqual(jobListing.discipline);
    expect(result!.location).toEqual(jobListing.location);
    expect(result!.company_name).toEqual(jobListing.company_name);
    // Updated at should be more recent
    expect(result!.updated_at.getTime()).toBeGreaterThan(jobListing.updated_at.getTime());
  });

  it('should update all fields of a job listing', async () => {
    // Create a job listing first
    const jobListing = await createTestJobListing();
    
    // Update all fields
    const updateInput: UpdateJobListingInput = {
      id: jobListing.id,
      title: 'Updated Title',
      description: 'Updated description',
      discipline: 'Data Engineering',
      location: 'New York, NY',
      company_name: 'Updated Company'
    };
    
    const result = await updateJobListing(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(jobListing.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.discipline).toEqual('Data Engineering');
    expect(result!.location).toEqual('New York, NY');
    expect(result!.company_name).toEqual('Updated Company');
    // Updated at should be more recent
    expect(result!.updated_at.getTime()).toBeGreaterThan(jobListing.updated_at.getTime());
  });

  it('should return null when trying to update a non-existent job listing', async () => {
    const updateInput: UpdateJobListingInput = {
      id: 99999, // Non-existent ID
      title: 'Non-existent Job'
    };
    
    const result = await updateJobListing(updateInput);
    
    expect(result).toBeNull();
  });

  it('should save updated job listing to database', async () => {
    // Create a job listing first
    const jobListing = await createTestJobListing();
    
    // Update the job listing
    const updateInput: UpdateJobListingInput = {
      id: jobListing.id,
      title: 'Database Updated Title',
      location: 'Remote'
    };
    
    const result = await updateJobListing(updateInput);
    
    // Query the database to verify the update was saved
    const dbResult = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, jobListing.id))
      .execute();
      
    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].title).toEqual('Database Updated Title');
    expect(dbResult[0].location).toEqual('Remote');
    expect(dbResult[0].description).toEqual(jobListing.description); // Should be unchanged
    // Updated at should be more recent
    expect(dbResult[0].updated_at.getTime()).toBeGreaterThan(jobListing.updated_at.getTime());
  });
});
