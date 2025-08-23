import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { type CreatePomodoroSettingsInput } from '../schema';
import { createPomodoroSettings } from '../handlers/create_pomodoro_settings';
import { eq } from 'drizzle-orm';

describe('createPomodoroSettings handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a settings record with provided values', async () => {
    const input: CreatePomodoroSettingsInput = {
      work_interval: 30,
      break_interval: 10,
    };

    const result = await createPomodoroSettings(input);

    expect(result.id).toBeDefined();
    expect(result.work_interval).toBe(30);
    expect(result.break_interval).toBe(10);

    // Verify persisted values in DB
    const rows = await db.select().from(pomodoroSettingsTable).where(eq(pomodoroSettingsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.work_interval).toBe(30);
    expect(row.break_interval).toBe(10);
  });

  it('uses database defaults when fields are omitted', async () => {
    const input: CreatePomodoroSettingsInput = {};
    const result = await createPomodoroSettings(input);

    expect(result.id).toBeDefined();
    // Defaults from DB schema
    expect(result.work_interval).toBe(25);
    expect(result.break_interval).toBe(5);

    // Verify defaults persisted
    const rows = await db.select().from(pomodoroSettingsTable).where(eq(pomodoroSettingsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.work_interval).toBe(25);
    expect(row.break_interval).toBe(5);
  });
});
