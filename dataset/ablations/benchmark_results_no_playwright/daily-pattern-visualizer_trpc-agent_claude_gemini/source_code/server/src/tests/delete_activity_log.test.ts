import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type CreateActivityLogInput } from '../schema';
import { deleteActivityLog } from '../handlers/delete_activity_log';
import { eq } from 'drizzle-orm';

// Test data for creating activity log
const testActivityLog: CreateActivityLogInput = {
  user_id: 'test-user-123',
  date: new Date('2024-01-15'),
  sleep_hours: 8.5,
  work_hours: 7.0,
  social_hours: 2.5,
  screen_hours: 4.0,
  emotional_energy: 7,
  notes: 'Test activity log entry'
};

describe('deleteActivityLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing activity log', async () => {
    // Create a test activity log first
    const createResult = await db.insert(activityLogsTable)
      .values({
        user_id: testActivityLog.user_id,
        date: testActivityLog.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        sleep_hours: testActivityLog.sleep_hours.toString(),
        work_hours: testActivityLog.work_hours.toString(),
        social_hours: testActivityLog.social_hours.toString(),
        screen_hours: testActivityLog.screen_hours.toString(),
        emotional_energy: testActivityLog.emotional_energy,
        notes: testActivityLog.notes
      })
      .returning()
      .execute();

    const activityLogId = createResult[0].id;

    // Delete the activity log
    const result = await deleteActivityLog(activityLogId);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the record no longer exists in database
    const deletedLog = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, activityLogId))
      .execute();

    expect(deletedLog).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent activity log', async () => {
    const nonExistentId = 99999;

    const result = await deleteActivityLog(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should not affect other activity logs when deleting one', async () => {
    // Create two test activity logs
    const firstLog = await db.insert(activityLogsTable)
      .values({
        user_id: testActivityLog.user_id,
        date: '2024-01-15',
        sleep_hours: testActivityLog.sleep_hours.toString(),
        work_hours: testActivityLog.work_hours.toString(),
        social_hours: testActivityLog.social_hours.toString(),
        screen_hours: testActivityLog.screen_hours.toString(),
        emotional_energy: testActivityLog.emotional_energy,
        notes: 'First log'
      })
      .returning()
      .execute();

    const secondLog = await db.insert(activityLogsTable)
      .values({
        user_id: testActivityLog.user_id,
        date: '2024-01-16',
        sleep_hours: testActivityLog.sleep_hours.toString(),
        work_hours: testActivityLog.work_hours.toString(),
        social_hours: testActivityLog.social_hours.toString(),
        screen_hours: testActivityLog.screen_hours.toString(),
        emotional_energy: testActivityLog.emotional_energy,
        notes: 'Second log'
      })
      .returning()
      .execute();

    // Delete the first log
    const result = await deleteActivityLog(firstLog[0].id);

    expect(result.success).toBe(true);

    // Verify first log is deleted
    const deletedLog = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, firstLog[0].id))
      .execute();

    expect(deletedLog).toHaveLength(0);

    // Verify second log still exists
    const remainingLog = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, secondLog[0].id))
      .execute();

    expect(remainingLog).toHaveLength(1);
    expect(remainingLog[0].notes).toEqual('Second log');
  });

  it('should handle deletion of logs with null notes', async () => {
    // Create activity log without notes
    const logWithoutNotes = await db.insert(activityLogsTable)
      .values({
        user_id: testActivityLog.user_id,
        date: '2024-01-17',
        sleep_hours: testActivityLog.sleep_hours.toString(),
        work_hours: testActivityLog.work_hours.toString(),
        social_hours: testActivityLog.social_hours.toString(),
        screen_hours: testActivityLog.screen_hours.toString(),
        emotional_energy: testActivityLog.emotional_energy,
        notes: null
      })
      .returning()
      .execute();

    const result = await deleteActivityLog(logWithoutNotes[0].id);

    expect(result.success).toBe(true);

    // Verify deletion
    const deletedLog = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, logWithoutNotes[0].id))
      .execute();

    expect(deletedLog).toHaveLength(0);
  });
});
