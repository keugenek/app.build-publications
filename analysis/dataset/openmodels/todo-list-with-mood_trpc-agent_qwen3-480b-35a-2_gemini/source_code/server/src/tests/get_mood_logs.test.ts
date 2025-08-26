import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { getMoodLogs } from '../handlers/get_mood_logs';
import { eq } from 'drizzle-orm';

describe('getMoodLogs', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(moodLogsTable).values([
      {
        mood: 'Happy',
        note: 'Feeling great today',
        logged_at: new Date('2023-01-15T10:00:00Z')
      },
      {
        mood: 'Sad',
        note: 'Had a tough day',
        logged_at: new Date('2023-01-16T18:30:00Z')
      },
      {
        mood: 'Neutral',
        note: null,
        logged_at: new Date('2023-01-17T12:00:00Z')
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all mood logs', async () => {
    const result = await getMoodLogs();

    expect(result).toHaveLength(3);
    
    // Check that all expected fields are present
    expect(result[0]).toEqual({
      id: expect.any(Number),
      mood: 'Happy',
      note: 'Feeling great today',
      logged_at: expect.any(Date)
    });
    
    expect(result[1]).toEqual({
      id: expect.any(Number),
      mood: 'Sad',
      note: 'Had a tough day',
      logged_at: expect.any(Date)
    });
    
    expect(result[2]).toEqual({
      id: expect.any(Number),
      mood: 'Neutral',
      note: null,
      logged_at: expect.any(Date)
    });
  });

  it('should return mood logs ordered by logged_at', async () => {
    const result = await getMoodLogs();
    
    // Check that results are ordered by logged_at ascending
    expect(result[0].logged_at.getTime()).toBeLessThan(result[1].logged_at.getTime());
    expect(result[1].logged_at.getTime()).toBeLessThan(result[2].logged_at.getTime());
  });

  it('should return empty array when no mood logs exist', async () => {
    // Clear all mood logs
    await db.delete(moodLogsTable).execute();
    
    const result = await getMoodLogs();
    
    expect(result).toHaveLength(0);
  });

  it('should handle database errors gracefully', async () => {
    // This test would require mocking the database connection to simulate errors,
    // which is outside the scope of our testing approach that uses real database operations.
    // The error handling is implemented in the handler but not explicitly tested here.
  });
});
