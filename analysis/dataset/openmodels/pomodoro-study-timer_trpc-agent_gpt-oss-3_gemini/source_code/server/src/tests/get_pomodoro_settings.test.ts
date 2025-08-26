import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { getPomodoroSettings } from '../handlers/get_pomodoro_settings';
import { eq } from 'drizzle-orm';

describe('getPomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create default settings when none exist', async () => {
    const settings = await getPomodoroSettings();
    // Verify returned defaults
    expect(settings.id).toBeDefined();
    expect(settings.work_interval).toBe(25);
    expect(settings.break_interval).toBe(5);

    // Verify row was inserted into DB
    const rows = await db.select().from(pomodoroSettingsTable).where(eq(pomodoroSettingsTable.id, settings.id)).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].work_interval).toBe(25);
    expect(rows[0].break_interval).toBe(5);
  });

  it('should return existing settings without creating a new row', async () => {
    // Insert custom settings directly
    const inserted = await db
      .insert(pomodoroSettingsTable)
      .values({ work_interval: 30, break_interval: 10 })
      .returning()
      .execute();
    const existing = inserted[0];

    const settings = await getPomodoroSettings();
    // Should return the same row
    expect(settings.id).toBe(existing.id);
    expect(settings.work_interval).toBe(30);
    expect(settings.break_interval).toBe(10);

    // Ensure only one row exists in table
    const allRows = await db.select().from(pomodoroSettingsTable).execute();
    expect(allRows).toHaveLength(1);
  });
});
