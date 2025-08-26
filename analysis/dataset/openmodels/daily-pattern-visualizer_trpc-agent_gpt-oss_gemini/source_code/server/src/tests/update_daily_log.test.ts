import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { type UpdateDailyLogInput } from '../schema';
import { updateDailyLog } from '../handlers/update_daily_log';

// Helper to create a daily log entry directly via DB
const insertDailyLog = async (data: Partial<typeof dailyLogsTable.$inferInsert>) => {
  const result = await db
    .insert(dailyLogsTable)
    .values({
      logged_at: data.logged_at ?? new Date(),
      sleep_hours: data.sleep_hours ?? 8,
      work_hours: data.work_hours ?? 8,
      social_hours: data.social_hours ?? 2,
      screen_hours: data.screen_hours ?? 4,
      emotional_energy: data.emotional_energy ?? 5,
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateDailyLog handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates only provided fields and retains others', async () => {
    // Insert initial log
    const original = await insertDailyLog({});

    // Prepare partial update input
    const updateInput: UpdateDailyLogInput = {
      id: original.id,
      sleep_hours: 9.5, // change
      emotional_energy: 7, // change
      // other fields omitted
    };

    const updated = await updateDailyLog(updateInput);

    // Verify updated fields
    expect(updated.sleep_hours).toBe(9.5);
    expect(updated.emotional_energy).toBe(7);

    // Verify unchanged fields remain the same as original
    expect(updated.work_hours).toBe(original.work_hours);
    expect(updated.social_hours).toBe(original.social_hours);
    expect(updated.screen_hours).toBe(original.screen_hours);
    // logged_at should stay the same (original value)
    expect(updated.logged_at.getTime()).toBe(original.logged_at.getTime());
  });

  it('throws an error when log does not exist', async () => {
    const nonExistentId = 9999;
    const updateInput: UpdateDailyLogInput = {
      id: nonExistentId,
      sleep_hours: 10,
    };

    await expect(updateDailyLog(updateInput)).rejects.toThrow(`DailyLog with id ${nonExistentId} not found`);
  });
});
