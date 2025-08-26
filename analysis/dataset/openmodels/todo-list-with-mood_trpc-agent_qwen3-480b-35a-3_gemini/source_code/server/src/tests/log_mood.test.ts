import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type LogMoodInput } from '../schema';
import { logMood } from '../handlers/log_mood';
import { eq } from 'drizzle-orm';

// Test input
const testInput: LogMoodInput = {
  mood: 4,
  description: 'Feeling productive today'
};

describe('logMood', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should log a mood entry', async () => {
    const result = await logMood(testInput);

    // Basic field validation
    expect(result.mood).toEqual(4);
    expect(result.description).toEqual('Feeling productive today');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save mood to database', async () => {
    const result = await logMood(testInput);

    // Query using proper drizzle syntax
    const moods = await db.select()
      .from(moodsTable)
      .where(eq(moodsTable.id, result.id))
      .execute();

    expect(moods).toHaveLength(1);
    expect(moods[0].mood).toEqual(4);
    expect(moods[0].description).toEqual('Feeling productive today');
    expect(moods[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle mood logging without description', async () => {
    const inputWithoutDescription: LogMoodInput = {
      mood: 2
    };

    const result = await logMood(inputWithoutDescription);

    expect(result.mood).toEqual(2);
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const moods = await db.select()
      .from(moodsTable)
      .where(eq(moodsTable.id, result.id))
      .execute();

    expect(moods).toHaveLength(1);
    expect(moods[0].mood).toEqual(2);
    expect(moods[0].description).toBeNull();
  });
});
