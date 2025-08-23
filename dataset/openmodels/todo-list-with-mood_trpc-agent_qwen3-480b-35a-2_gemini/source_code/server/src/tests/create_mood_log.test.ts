import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type CreateMoodLogInput } from '../schema';
import { createMoodLog } from '../handlers/create_mood_log';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateMoodLogInput = {
  mood: 'Happy',
  note: 'Feeling great today!'
};

describe('createMoodLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a mood log', async () => {
    const result = await createMoodLog(testInput);

    // Basic field validation
    expect(result.mood).toEqual('Happy');
    expect(result.note).toEqual('Feeling great today!');
    expect(result.id).toBeDefined();
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should save mood log to database', async () => {
    const result = await createMoodLog(testInput);

    // Query using proper drizzle syntax
    const moodLogs = await db.select()
      .from(moodLogsTable)
      .where(eq(moodLogsTable.id, result.id))
      .execute();

    expect(moodLogs).toHaveLength(1);
    expect(moodLogs[0].mood).toEqual('Happy');
    expect(moodLogs[0].note).toEqual('Feeling great today!');
    expect(moodLogs[0].logged_at).toBeInstanceOf(Date);
  });

  it('should handle mood log with null note', async () => {
    const inputWithNullNote: CreateMoodLogInput = {
      mood: 'Sad',
      note: null
    };

    const result = await createMoodLog(inputWithNullNote);

    expect(result.mood).toEqual('Sad');
    expect(result.note).toBeNull();
    
    // Verify in database
    const moodLogs = await db.select()
      .from(moodLogsTable)
      .where(eq(moodLogsTable.id, result.id))
      .execute();

    expect(moodLogs).toHaveLength(1);
    expect(moodLogs[0].mood).toEqual('Sad');
    expect(moodLogs[0].note).toBeNull();
  });
});
