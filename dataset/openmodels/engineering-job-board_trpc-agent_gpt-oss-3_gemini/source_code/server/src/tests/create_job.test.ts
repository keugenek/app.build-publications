import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput } from '../schema';
import { createJob } from '../handlers/create_job';
import { eq } from 'drizzle-orm';

const testInput: CreateJobInput = {
  title: 'Senior Engineer',
  company: 'Tech Corp',
  location: 'San Francisco',
  discipline: 'Software',
  description: 'Develop awesome products.',
  application_contact: 'jobs@techcorp.com',
};

describe('createJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job posting with correct fields', async () => {
    const result = await createJob(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toBe(testInput.title);
    expect(result.company).toBe(testInput.company);
    expect(result.location).toBe(testInput.location);
    expect(result.discipline).toBe(testInput.discipline);
    expect(result.description).toBe(testInput.description);
    expect(result.application_contact).toBe(testInput.application_contact);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the job in the database', async () => {
    const result = await createJob(testInput);

    const jobs = await db.select().from(jobsTable).where(eq(jobsTable.id, result.id)).execute();
    expect(jobs).toHaveLength(1);
    const saved = jobs[0];
    expect(saved.title).toBe(testInput.title);
    expect(saved.company).toBe(testInput.company);
    expect(saved.location).toBe(testInput.location);
    expect(saved.discipline).toBe(testInput.discipline);
    expect(saved.description).toBe(testInput.description);
    expect(saved.application_contact).toBe(testInput.application_contact);
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
