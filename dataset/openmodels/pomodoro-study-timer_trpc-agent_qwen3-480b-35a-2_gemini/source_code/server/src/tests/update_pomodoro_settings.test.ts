import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { type CreatePomodoroSettingsInput, type UpdatePomodoroSettingsInput } from '../schema';
import { updatePomodoroSettings } from '../handlers/update_pomodoro_settings';
import { eq } from 'drizzle-orm';

// Helper function to create test settings
const createTestSettings = async (overrides: Partial<CreatePomodoroSettingsInput> = {}) => {
  const defaultSettings: CreatePomodoroSettingsInput = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  };

  const settingsData = { ...defaultSettings, ...overrides };

  const result = await db.insert(pomodoroSettingsTable)
    .values(settingsData)
    .returning()
    .execute();

  return result[0];
};

describe('updatePomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of Pomodoro settings', async () => {
    // Create initial settings
    const initialSettings = await createTestSettings();
    
    // Update all fields
    const updateInput: UpdatePomodoroSettingsInput = {
      id: initialSettings.id,
      workDuration: 30,
      shortBreakDuration: 10,
      longBreakDuration: 20,
      longBreakInterval: 4
    };

    const result = await updatePomodoroSettings(updateInput);

    // Validate updated values
    expect(result.id).toEqual(initialSettings.id);
    expect(result.workDuration).toEqual(30);
    expect(result.shortBreakDuration).toEqual(10);
    expect(result.longBreakDuration).toEqual(20);
    expect(result.longBreakInterval).toEqual(4);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialSettings.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    // Create initial settings
    const initialSettings = await createTestSettings({
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4
    });
    
    // Update only workDuration
    const updateInput: UpdatePomodoroSettingsInput = {
      id: initialSettings.id,
      workDuration: 30
    };

    const result = await updatePomodoroSettings(updateInput);

    // Validate that only workDuration changed
    expect(result.id).toEqual(initialSettings.id);
    expect(result.workDuration).toEqual(30);
    expect(result.shortBreakDuration).toEqual(5); // unchanged
    expect(result.longBreakDuration).toEqual(15); // unchanged
    expect(result.longBreakInterval).toEqual(4); // unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialSettings.updated_at.getTime());
  });

  it('should throw error when updating non-existent settings', async () => {
    const updateInput: UpdatePomodoroSettingsInput = {
      id: 99999,
      workDuration: 30
    };

    await expect(updatePomodoroSettings(updateInput))
      .rejects
      .toThrow(/Pomodoro settings not found/i);
  });

  it('should save updated settings to database', async () => {
    // Create initial settings
    const initialSettings = await createTestSettings();
    
    // Update settings
    const updateInput: UpdatePomodoroSettingsInput = {
      id: initialSettings.id,
      shortBreakDuration: 8,
      longBreakDuration: 18
    };

    const result = await updatePomodoroSettings(updateInput);

    // Query database to verify changes were saved
    const settingsInDB = await db.select()
      .from(pomodoroSettingsTable)
      .where(eq(pomodoroSettingsTable.id, result.id))
      .execute();

    expect(settingsInDB).toHaveLength(1);
    expect(settingsInDB[0].id).toEqual(initialSettings.id);
    expect(settingsInDB[0].workDuration).toEqual(initialSettings.workDuration); // unchanged
    expect(settingsInDB[0].shortBreakDuration).toEqual(8); // updated
    expect(settingsInDB[0].longBreakDuration).toEqual(18); // updated
    expect(settingsInDB[0].longBreakInterval).toEqual(initialSettings.longBreakInterval); // unchanged
    expect(settingsInDB[0].updated_at).toBeInstanceOf(Date);
    expect(settingsInDB[0].updated_at.getTime()).toBeGreaterThan(initialSettings.updated_at.getTime());
  });
});
