import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { type CreatePomodoroSettingsInput } from '../schema';
import { createPomodoroSettings } from '../handlers/create_pomodoro_settings';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePomodoroSettingsInput = {
  workDuration: 25 * 60, // 25 minutes in seconds
  shortBreakDuration: 5 * 60, // 5 minutes in seconds
  longBreakDuration: 15 * 60, // 15 minutes in seconds
  longBreakInterval: 4 // every 4 pomodoros
};

describe('createPomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create Pomodoro settings', async () => {
    const result = await createPomodoroSettings(testInput);

    // Basic field validation
    expect(result.workDuration).toEqual(testInput.workDuration);
    expect(result.shortBreakDuration).toEqual(testInput.shortBreakDuration);
    expect(result.longBreakDuration).toEqual(testInput.longBreakDuration);
    expect(result.longBreakInterval).toEqual(testInput.longBreakInterval);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save Pomodoro settings to database', async () => {
    const result = await createPomodoroSettings(testInput);

    // Query the saved settings
    const settings = await db.select()
      .from(pomodoroSettingsTable)
      .where(eq(pomodoroSettingsTable.id, result.id))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].workDuration).toEqual(testInput.workDuration);
    expect(settings[0].shortBreakDuration).toEqual(testInput.shortBreakDuration);
    expect(settings[0].longBreakDuration).toEqual(testInput.longBreakDuration);
    expect(settings[0].longBreakInterval).toEqual(testInput.longBreakInterval);
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should have consistent timestamps', async () => {
    const result = await createPomodoroSettings(testInput);

    // When creating new settings, created_at and updated_at should be equal
    expect(result.created_at).toEqual(result.updated_at);
  });
});
