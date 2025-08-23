import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type ActivityLog } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

// Sample input for creating an activity log
const testInput: CreateActivityInput = {
  cat_name: 'Whiskers',
  activity_type: 'staring',
  description: 'Stared at a laser pointer',
  score: 5,
};

describe('createActivity handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a new activity and return the full activity log', async () => {
    const result = await createActivity(testInput);

    // Validate returned fields
    expect(result.id).toBeDefined();
    expect(result.cat_name).toBe(testInput.cat_name);
    expect(result.activity_type).toBe(testInput.activity_type);
    expect(result.description).toBe(testInput.description ?? null);
    expect(result.score).toBe(testInput.score);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the activity in the database with correct values', async () => {
    const result = await createActivity(testInput);

    const records = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record.cat_name).toBe(testInput.cat_name);
    expect(record.activity_type).toBe(testInput.activity_type);
    expect(record.description).toBe(testInput.description ?? null);
    expect(record.score).toBe(testInput.score);
    expect(record.created_at).toBeInstanceOf(Date);
  });

  it('should allow nullable description and handle omitted description correctly', async () => {
    const inputWithoutDesc: CreateActivityInput = {
      cat_name: 'Mittens',
      activity_type: 'gift',
      // description omitted
      score: 3,
    } as any; // cast to any to omit optional field for test simplicity

    const result = await createActivity(inputWithoutDesc);
    expect(result.description).toBeNull();

    const record = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();
    expect(record[0].description).toBeNull();
  });
});
