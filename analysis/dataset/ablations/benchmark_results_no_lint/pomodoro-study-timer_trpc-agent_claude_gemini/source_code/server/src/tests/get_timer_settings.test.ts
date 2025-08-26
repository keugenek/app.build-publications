import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { getTimerSettings } from '../handlers/get_timer_settings';

describe('getTimerSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default settings when none exist', async () => {
    const result = await getTimerSettings();

    // Verify default values are returned
    expect(result.work_duration_minutes).toEqual(25);
    expect(result.break_duration_minutes).toEqual(5);
    expect(result.audio_enabled).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create default settings in database when none exist', async () => {
    await getTimerSettings();

    // Verify the default settings were saved to database
    const settings = await db.select()
      .from(timerSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].work_duration_minutes).toEqual(25);
    expect(settings[0].break_duration_minutes).toEqual(5);
    expect(settings[0].audio_enabled).toEqual(true);
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return existing settings when they exist', async () => {
    // Create custom settings first
    const customSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 50,
        break_duration_minutes: 10,
        audio_enabled: false
      })
      .returning()
      .execute();

    const result = await getTimerSettings();

    // Should return the custom settings, not defaults
    expect(result.id).toEqual(customSettings[0].id);
    expect(result.work_duration_minutes).toEqual(50);
    expect(result.break_duration_minutes).toEqual(10);
    expect(result.audio_enabled).toEqual(false);
    expect(result.created_at).toEqual(customSettings[0].created_at);
    expect(result.updated_at).toEqual(customSettings[0].updated_at);
  });

  it('should return first settings when multiple exist', async () => {
    // Create two different settings records
    const firstSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 30,
        break_duration_minutes: 15,
        audio_enabled: true
      })
      .returning()
      .execute();

    await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 45,
        break_duration_minutes: 20,
        audio_enabled: false
      })
      .execute();

    const result = await getTimerSettings();

    // Should return the first settings record
    expect(result.id).toEqual(firstSettings[0].id);
    expect(result.work_duration_minutes).toEqual(30);
    expect(result.break_duration_minutes).toEqual(15);
    expect(result.audio_enabled).toEqual(true);
  });

  it('should not create duplicate defaults on multiple calls', async () => {
    // Call getTimerSettings multiple times
    await getTimerSettings();
    await getTimerSettings();
    await getTimerSettings();

    // Verify only one settings record exists
    const settings = await db.select()
      .from(timerSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].work_duration_minutes).toEqual(25);
    expect(settings[0].break_duration_minutes).toEqual(5);
    expect(settings[0].audio_enabled).toEqual(true);
  });
});
