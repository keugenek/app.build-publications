import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateJobInput } from '../schema';
import { updateJob } from '../handlers/update_job';

// Helper to insert a job directly into the DB
const insertJob = async () => {
  const result = await db
    .insert(jobsTable)
    .values({
      title: 'Original Title',
      description: 'Original description',
      discipline: 'Software' as any,
      location: 'Remote',
      salary: '60000.00', // numeric stored as string
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateJob handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update provided fields and leave others unchanged', async () => {
    const original = await insertJob();

    const input: UpdateJobInput = {
      id: original.id,
      title: 'Updated Title',
      salary: 75000,
    };

    const updated = await updateJob(input);

    // Verify returned object
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.salary).toBe(75000);
    // Unchanged fields
    expect(updated.description).toBe(original.description);
    expect(updated.discipline).toBe(original.discipline);
    expect(updated.location).toBe(original.location);
    expect(updated.posted_at).toBeInstanceOf(Date);

    // Verify DB persisted changes
    const dbJob = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, original.id))
      .execute();

    expect(dbJob).toHaveLength(1);
    const jobRow = dbJob[0];
    expect(jobRow.title).toBe('Updated Title');
    expect(parseFloat(jobRow.salary as any)).toBe(75000);
    // Other columns remain same
    expect(jobRow.description).toBe(original.description);
    expect(jobRow.discipline).toBe(original.discipline);
    expect(jobRow.location).toBe(original.location);
  });

  it('should update nullable description to null', async () => {
    const original = await insertJob();

    const input: UpdateJobInput = {
      id: original.id,
      description: null,
    };

    const updated = await updateJob(input);
    expect(updated.description).toBeNull();

    const dbJob = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, original.id))
      .execute();
    expect(dbJob[0].description).toBeNull();
  });
});
