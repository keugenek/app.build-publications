import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type UpdateMoodLogInput } from '../schema';
import { updateMoodLog } from '../handlers/update_mood_log';
import { eq } from 'drizzle-orm';

// Helper function to create a mood log directly in database
const createTestMoodLog = async (mood: 'Happy' | 'Sad' | 'Neutral' | 'Anxious' | 'Excited' = 'Happy', note: string | null = null) => {
  const result = await db.insert(moodLogsTable)
    .values({ mood, note })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateMoodLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a mood log with all fields', async () => {
    // Create a mood log first
    const createdLog = await createTestMoodLog('Happy', 'Feeling great today!');
    
    // Update the mood log
    const updateInput: UpdateMoodLogInput = {
      id: createdLog.id,
      mood: 'Sad',
      note: 'Not feeling well'
    };
    
    const result = await updateMoodLog(updateInput);

    // Validate returned data
    expect(result.id).toEqual(createdLog.id);
    expect(result.mood).toEqual('Sad');
    expect(result.note).toEqual('Not feeling well');
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should update only the mood field', async () => {
    // Create a mood log first
    const createdLog = await createTestMoodLog('Happy', 'Feeling great today!');
    
    // Update only the mood
    const updateInput: UpdateMoodLogInput = {
      id: createdLog.id,
      mood: 'Anxious'
    };
    
    const result = await updateMoodLog(updateInput);

    // Validate returned data
    expect(result.id).toEqual(createdLog.id);
    expect(result.mood).toEqual('Anxious');
    expect(result.note).toEqual('Feeling great today!'); // Should remain unchanged
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should update only the note field', async () => {
    // Create a mood log first
    const createdLog = await createTestMoodLog('Happy', 'Feeling great today!');
    
    // Update only the note
    const updateInput: UpdateMoodLogInput = {
      id: createdLog.id,
      note: 'Feeling much better now'
    };
    
    const result = await updateMoodLog(updateInput);

    // Validate returned data
    expect(result.id).toEqual(createdLog.id);
    expect(result.mood).toEqual('Happy'); // Should remain unchanged
    expect(result.note).toEqual('Feeling much better now');
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should save updated mood log to database', async () => {
    // Create a mood log first
    const createdLog = await createTestMoodLog('Happy', 'Feeling great today!');
    
    // Update the mood log
    const updateInput: UpdateMoodLogInput = {
      id: createdLog.id,
      mood: 'Neutral',
      note: 'Just a normal day'
    };
    
    await updateMoodLog(updateInput);

    // Query database to verify update was saved
    const moodLogs = await db.select()
      .from(moodLogsTable)
      .where(eq(moodLogsTable.id, createdLog.id))
      .execute();

    expect(moodLogs).toHaveLength(1);
    expect(moodLogs[0].mood).toEqual('Neutral');
    expect(moodLogs[0].note).toEqual('Just a normal day');
    expect(moodLogs[0].logged_at).toBeInstanceOf(Date);
  });

  it('should throw an error when mood log is not found', async () => {
    const updateInput: UpdateMoodLogInput = {
      id: 99999, // Non-existent ID
      mood: 'Happy'
    };
    
    await expect(updateMoodLog(updateInput)).rejects.toThrow(/not found/i);
  });
});
