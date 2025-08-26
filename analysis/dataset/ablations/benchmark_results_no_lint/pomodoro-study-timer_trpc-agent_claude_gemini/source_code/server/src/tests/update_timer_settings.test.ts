import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { type UpdateTimerSettingsInput } from '../schema';
import { updateTimerSettings } from '../handlers/update_timer_settings';
import { eq } from 'drizzle-orm';

describe('updateTimerSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new settings when none exist', async () => {
    const testInput: UpdateTimerSettingsInput = {
      work_duration_minutes: 30,
      break_duration_minutes: 10,
      audio_enabled: false
    };

    const result = await updateTimerSettings(testInput);

    // Verify returned values
    expect(result.work_duration_minutes).toEqual(30);
    expect(result.break_duration_minutes).toEqual(10);
    expect(result.audio_enabled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create new settings with defaults for omitted fields', async () => {
    const testInput: UpdateTimerSettingsInput = {
      work_duration_minutes: 45
    };

    const result = await updateTimerSettings(testInput);

    // Verify provided value and defaults
    expect(result.work_duration_minutes).toEqual(45);
    expect(result.break_duration_minutes).toEqual(5); // default
    expect(result.audio_enabled).toEqual(true); // default
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create settings with all defaults when input is empty', async () => {
    const testInput: UpdateTimerSettingsInput = {};

    const result = await updateTimerSettings(testInput);

    // Verify all defaults
    expect(result.work_duration_minutes).toEqual(25);
    expect(result.break_duration_minutes).toEqual(5);
    expect(result.audio_enabled).toEqual(true);
    expect(result.id).toBeDefined();
  });

  it('should update existing settings', async () => {
    // Create initial settings
    await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 25,
        break_duration_minutes: 5,
        audio_enabled: true
      })
      .execute();

    const testInput: UpdateTimerSettingsInput = {
      work_duration_minutes: 50,
      audio_enabled: false
    };

    const result = await updateTimerSettings(testInput);

    // Verify updated values
    expect(result.work_duration_minutes).toEqual(50);
    expect(result.break_duration_minutes).toEqual(5); // unchanged
    expect(result.audio_enabled).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields in existing settings', async () => {
    // Create initial settings
    const initial = await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 20,
        break_duration_minutes: 15,
        audio_enabled: false
      })
      .returning()
      .execute();

    const testInput: UpdateTimerSettingsInput = {
      break_duration_minutes: 8
    };

    const result = await updateTimerSettings(testInput);

    // Verify only break duration changed
    expect(result.work_duration_minutes).toEqual(20); // unchanged
    expect(result.break_duration_minutes).toEqual(8); // changed
    expect(result.audio_enabled).toEqual(false); // unchanged
    expect(result.id).toEqual(initial[0].id); // same record
    expect(result.updated_at > initial[0].updated_at).toBe(true);
  });

  it('should save settings to database correctly', async () => {
    const testInput: UpdateTimerSettingsInput = {
      work_duration_minutes: 35,
      break_duration_minutes: 12,
      audio_enabled: false
    };

    const result = await updateTimerSettings(testInput);

    // Query database to verify persistence
    const savedSettings = await db.select()
      .from(timerSettingsTable)
      .where(eq(timerSettingsTable.id, result.id))
      .execute();

    expect(savedSettings).toHaveLength(1);
    expect(savedSettings[0].work_duration_minutes).toEqual(35);
    expect(savedSettings[0].break_duration_minutes).toEqual(12);
    expect(savedSettings[0].audio_enabled).toEqual(false);
    expect(savedSettings[0].created_at).toBeInstanceOf(Date);
    expect(savedSettings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the first settings record when multiple exist', async () => {
    // Create two settings records (edge case)
    const firstSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 25,
        break_duration_minutes: 5,
        audio_enabled: true
      })
      .returning()
      .execute();

    await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 30,
        break_duration_minutes: 10,
        audio_enabled: false
      })
      .execute();

    const testInput: UpdateTimerSettingsInput = {
      work_duration_minutes: 40
    };

    const result = await updateTimerSettings(testInput);

    // Should update the first record
    expect(result.id).toEqual(firstSettings[0].id);
    expect(result.work_duration_minutes).toEqual(40);
    expect(result.break_duration_minutes).toEqual(5); // from first record
    expect(result.audio_enabled).toEqual(true); // from first record
  });

  it('should handle boolean false values correctly', async () => {
    // Create initial settings with audio enabled
    await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 25,
        break_duration_minutes: 5,
        audio_enabled: true
      })
      .execute();

    const testInput: UpdateTimerSettingsInput = {
      audio_enabled: false
    };

    const result = await updateTimerSettings(testInput);

    // Verify boolean false is properly handled
    expect(result.audio_enabled).toEqual(false);
    expect(typeof result.audio_enabled).toBe('boolean');
  });
});
