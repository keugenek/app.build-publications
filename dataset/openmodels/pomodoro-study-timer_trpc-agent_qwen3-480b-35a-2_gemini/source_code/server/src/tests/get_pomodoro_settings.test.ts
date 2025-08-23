import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { getPomodoroSettings, updatePomodoroSettings } from '../handlers/get_pomodoro_settings';
import { eq } from 'drizzle-orm';

describe('getPomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create and return default settings when none exist', async () => {
    const result = await getPomodoroSettings();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.workDuration).toBe(1500); // 25 minutes in seconds
    expect(result.shortBreakDuration).toBe(300); // 5 minutes in seconds
    expect(result.longBreakDuration).toBe(900); // 15 minutes in seconds
    expect(result.longBreakInterval).toBe(4);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return existing settings when they exist', async () => {
    // First, create some settings
    const [createdSettings] = await db.insert(pomodoroSettingsTable).values({
      workDuration: 3000,
      shortBreakDuration: 600,
      longBreakDuration: 1200,
      longBreakInterval: 3,
    }).returning();

    const result = await getPomodoroSettings();

    expect(result).toBeDefined();
    expect(result.id).toBe(createdSettings.id);
    expect(result.workDuration).toBe(3000);
    expect(result.shortBreakDuration).toBe(600);
    expect(result.longBreakDuration).toBe(1200);
    expect(result.longBreakInterval).toBe(3);
  });
});

describe('updatePomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update existing pomodoro settings', async () => {
    // First, create some settings
    const [createdSettings] = await db.insert(pomodoroSettingsTable).values({
      workDuration: 3000,
      shortBreakDuration: 600,
      longBreakDuration: 1200,
      longBreakInterval: 3,
    }).returning();

    const updatedSettings = await updatePomodoroSettings({
      id: createdSettings.id,
      workDuration: 2500,
      shortBreakDuration: 500,
    });

    expect(updatedSettings).toBeDefined();
    expect(updatedSettings.id).toBe(createdSettings.id);
    expect(updatedSettings.workDuration).toBe(2500);
    expect(updatedSettings.shortBreakDuration).toBe(500);
    expect(updatedSettings.longBreakDuration).toBe(1200); // unchanged
    expect(updatedSettings.longBreakInterval).toBe(3); // unchanged
    expect(updatedSettings.updated_at.getTime()).toBeGreaterThan(createdSettings.updated_at.getTime());
  });

  it('should throw an error when trying to update non-existent settings', async () => {
    await expect(
      updatePomodoroSettings({
        id: 999,
        workDuration: 2500,
      })
    ).rejects.toThrow(/not found/);
  });

  it('should save updated settings to database', async () => {
    // First, create some settings
    const [createdSettings] = await db.insert(pomodoroSettingsTable).values({
      workDuration: 3000,
      shortBreakDuration: 600,
      longBreakDuration: 1200,
      longBreakInterval: 3,
    }).returning();

    const updatedSettings = await updatePomodoroSettings({
      id: createdSettings.id,
      workDuration: 2500,
    });

    // Query the database to verify the update was saved
    const [dbSettings] = await db.select()
      .from(pomodoroSettingsTable)
      .where(eq(pomodoroSettingsTable.id, createdSettings.id))
      .execute();

    expect(dbSettings).toBeDefined();
    expect(dbSettings.workDuration).toBe(2500);
    expect(dbSettings.shortBreakDuration).toBe(600); // unchanged
    expect(dbSettings.updated_at.getTime()).toBeGreaterThan(createdSettings.updated_at.getTime());
  });
});
