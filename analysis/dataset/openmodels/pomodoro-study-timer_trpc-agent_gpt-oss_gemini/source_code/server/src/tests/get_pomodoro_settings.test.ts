import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { getPomodoroSettings } from '../handlers/get_pomodoro_settings';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**\
 * The pomodoro settings table is a single‑row configuration. The handler should:
 * 1. Return the existing row if present.
 * 2. Insert a default row when the table is empty and then return it.
 * 3. Preserve correct types (numbers for minutes, Date for created_at).
 */
describe('getPomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates default settings when none exist', async () => {
    const settings = await getPomodoroSettings();
    expect(settings.id).toBeGreaterThan(0);
    expect(settings.work_minutes).toBe(25);
    expect(settings.break_minutes).toBe(5);
    expect(settings.created_at).toBeInstanceOf(Date);

    // Verify row persisted in DB
    const rows = await db
      .select()
      .from(pomodoroSettingsTable)
      .where(eq(pomodoroSettingsTable.id, settings.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.work_minutes).toBe(25);
    expect(row.break_minutes).toBe(5);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('returns the same row on subsequent calls', async () => {
    const first = await getPomodoroSettings();
    const second = await getPomodoroSettings();
    expect(second.id).toBe(first.id);
    expect(second.work_minutes).toBe(first.work_minutes);
    expect(second.break_minutes).toBe(first.break_minutes);
    expect(second.created_at.getTime()).toBe(first.created_at.getTime());
  });
});
