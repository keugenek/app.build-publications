import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput } from '../schema';
import { createJob } from '../handlers/create_job';
import { eq } from 'drizzle-orm';

// Simple test input matching schema requirements
const testInput: CreateJobInput = {
  title: 'Senior Engineer',
  description: 'Design and develop systems',
  discipline: 'Software',
  location: 'Remote',
  salary: 120000,
};

describe('createJob handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job and return correctly typed fields', async () => {
    const result = await createJob(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toBe(testInput.title);
    expect(result.description).toBe(testInput.description);
    expect(result.discipline).toBe(testInput.discipline);
    expect(result.location).toBe(testInput.location);
    // salary should be a number after conversion
    expect(result.salary).toBeCloseTo(testInput.salary!);
    expect(result.posted_at).toBeInstanceOf(Date);
  });

  it('should persist the job in the database with correct values', async () => {
    const result = await createJob(testInput);

    const rows = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const persisted = rows[0];
    expect(persisted.title).toBe(testInput.title);
    expect(persisted.description).toBe(testInput.description);
    expect(persisted.discipline).toBe(testInput.discipline);
    expect(persisted.location).toBe(testInput.location);
    // salary stored as string in DB, convert to number for assertion
    expect(parseFloat(persisted.salary as unknown as string)).toBeCloseTo(testInput.salary!);
    expect(persisted.posted_at).toBeInstanceOf(Date);
  });

  it('should handle nullable description and optional salary', async () => {
    const input: CreateJobInput = {
      title: 'Junior Engineer',
      description: null,
      discipline: 'Mechanical',
      location: 'Onsite',
      // salary omitted
    };
    const result = await createJob(input);

    expect(result.description).toBeNull();
    expect(result.salary).toBeUndefined();

    const rows = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, result.id))
      .execute();
    const persisted = rows[0];
    expect(persisted.description).toBeNull();
    expect(persisted.salary).toBeNull();
  });
});
