import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { getJobListing } from '../handlers/get_job_listing';
import { eq } from 'drizzle-orm';

describe('getJobListing', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test job listing
    await db.insert(jobListingsTable).values({
      title: 'Software Engineer',
      description: 'Develop amazing software',
      discipline: 'Software Engineering',
      location: 'San Francisco, CA',
      company_name: 'Tech Corp'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing job listing by ID', async () => {
    // First get the ID of the inserted job listing
    const insertedJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.title, 'Software Engineer'))
      .execute();
    
    expect(insertedJob).toHaveLength(1);
    const jobId = insertedJob[0].id;
    
    // Test the handler
    const result = await getJobListing(jobId);
    
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    expect(result?.id).toBe(jobId);
    expect(result?.title).toBe('Software Engineer');
    expect(result?.description).toBe('Develop amazing software');
    expect(result?.discipline).toBe('Software Engineering');
    expect(result?.location).toBe('San Francisco, CA');
    expect(result?.company_name).toBe('Tech Corp');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for a non-existent job listing ID', async () => {
    const result = await getJobListing(99999);
    expect(result).toBeNull();
  });

  it('should handle invalid ID gracefully', async () => {
    // Test with negative ID
    const result = await getJobListing(-1);
    expect(result).toBeNull();
  });
});
