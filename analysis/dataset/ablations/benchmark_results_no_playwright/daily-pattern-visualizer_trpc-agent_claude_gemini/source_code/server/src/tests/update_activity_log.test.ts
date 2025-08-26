import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type UpdateActivityLogInput } from '../schema';
import { updateActivityLog } from '../handlers/update_activity_log';
import { eq } from 'drizzle-orm';

describe('updateActivityLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test activity log
  const createTestLog = async () => {
    const result = await db.insert(activityLogsTable)
      .values({
        user_id: 'test-user-123',
        date: '2024-01-15',
        sleep_hours: '8.5',
        work_hours: '7.0',
        social_hours: '2.5',
        screen_hours: '6.0',
        emotional_energy: 7,
        notes: 'Original notes'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a single field', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 9.0
    };

    const result = await updateActivityLog(input);

    expect(result.id).toEqual(testLog.id);
    expect(result.sleep_hours).toEqual(9.0);
    expect(result.work_hours).toEqual(7.0); // Should remain unchanged
    expect(result.social_hours).toEqual(2.5); // Should remain unchanged
    expect(result.screen_hours).toEqual(6.0); // Should remain unchanged
    expect(result.emotional_energy).toEqual(7); // Should remain unchanged
    expect(result.notes).toEqual('Original notes'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 9.5,
      work_hours: 8.0,
      emotional_energy: 9,
      notes: 'Updated notes'
    };

    const result = await updateActivityLog(input);

    expect(result.id).toEqual(testLog.id);
    expect(result.sleep_hours).toEqual(9.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_hours).toEqual(2.5); // Should remain unchanged
    expect(result.screen_hours).toEqual(6.0); // Should remain unchanged
    expect(result.emotional_energy).toEqual(9);
    expect(result.notes).toEqual('Updated notes');
    expect(result.user_id).toEqual('test-user-123'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update notes to null', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      notes: null
    };

    const result = await updateActivityLog(input);

    expect(result.id).toEqual(testLog.id);
    expect(result.notes).toBeNull();
    expect(result.sleep_hours).toEqual(8.5); // Other fields should remain unchanged
  });

  it('should update all numeric fields correctly', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 10.5,
      work_hours: 9.25,
      social_hours: 3.75,
      screen_hours: 4.5,
      emotional_energy: 8
    };

    const result = await updateActivityLog(input);

    expect(result.sleep_hours).toEqual(10.5);
    expect(result.work_hours).toEqual(9.25);
    expect(result.social_hours).toEqual(3.75);
    expect(result.screen_hours).toEqual(4.5);
    expect(result.emotional_energy).toEqual(8);
    expect(typeof result.sleep_hours).toEqual('number');
    expect(typeof result.work_hours).toEqual('number');
    expect(typeof result.social_hours).toEqual('number');
    expect(typeof result.screen_hours).toEqual('number');
  });

  it('should persist changes to database', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 10.0,
      notes: 'Database persistence test'
    };

    await updateActivityLog(input);

    // Query database to verify changes were persisted
    const updatedLogs = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, testLog.id))
      .execute();

    expect(updatedLogs).toHaveLength(1);
    expect(parseFloat(updatedLogs[0].sleep_hours)).toEqual(10.0);
    expect(updatedLogs[0].notes).toEqual('Database persistence test');
    expect(updatedLogs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when activity log does not exist', async () => {
    const input: UpdateActivityLogInput = {
      id: 99999, // Non-existent ID
      sleep_hours: 8.0
    };

    expect(updateActivityLog(input)).rejects.toThrow(/Activity log with id 99999 not found/i);
  });

  it('should handle boundary values correctly', async () => {
    const testLog = await createTestLog();
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 0,
      work_hours: 24,
      social_hours: 0,
      screen_hours: 24,
      emotional_energy: 1
    };

    const result = await updateActivityLog(input);

    expect(result.sleep_hours).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_hours).toEqual(0);
    expect(result.screen_hours).toEqual(24);
    expect(result.emotional_energy).toEqual(1);
  });

  it('should update updated_at timestamp', async () => {
    const testLog = await createTestLog();
    const originalUpdatedAt = testLog.updated_at;
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input: UpdateActivityLogInput = {
      id: testLog.id,
      sleep_hours: 9.0
    };

    const result = await updateActivityLog(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
