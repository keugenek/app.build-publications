import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { getTimerSettings } from '../handlers/get_timer_settings';
import { eq } from 'drizzle-orm';

describe('getTimerSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default settings when no settings exist', async () => {
    const result = await getTimerSettings();

    // Should return default values
    expect(result.work_duration).toEqual(25);
    expect(result.break_duration).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create default settings in database when none exist', async () => {
    await getTimerSettings();

    // Verify settings were created in database
    const settings = await db.select()
      .from(timerSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].work_duration).toEqual(25);
    expect(settings[0].break_duration).toEqual(5);
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return existing settings when they exist', async () => {
    // Create existing settings with custom values
    const existingSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration: 45,
        break_duration: 10
      })
      .returning()
      .execute();

    const result = await getTimerSettings();

    // Should return the existing settings, not defaults
    expect(result.id).toEqual(existingSettings[0].id);
    expect(result.work_duration).toEqual(45);
    expect(result.break_duration).toEqual(10);
    expect(result.created_at).toEqual(existingSettings[0].created_at);
    expect(result.updated_at).toEqual(existingSettings[0].updated_at);
  });

  it('should return first settings when multiple exist', async () => {
    // Create multiple settings records
    await db.insert(timerSettingsTable)
      .values([
        { work_duration: 30, break_duration: 8 },
        { work_duration: 20, break_duration: 3 }
      ])
      .execute();

    const result = await getTimerSettings();

    // Should return the first record (by creation order)
    expect(result.work_duration).toEqual(30);
    expect(result.break_duration).toEqual(8);
  });

  it('should not create duplicate default settings on subsequent calls', async () => {
    // First call - should create defaults
    await getTimerSettings();

    // Second call - should return existing, not create new
    await getTimerSettings();

    // Verify only one record exists
    const allSettings = await db.select()
      .from(timerSettingsTable)
      .execute();

    expect(allSettings).toHaveLength(1);
    expect(allSettings[0].work_duration).toEqual(25);
    expect(allSettings[0].break_duration).toEqual(5);
  });
});
