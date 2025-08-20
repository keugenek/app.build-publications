import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { updatePomodoroSettings } from '../handlers/update_pomodoro_settings';
import { eq } from 'drizzle-orm';
import type { UpdatePomodoroSettingsInput } from '../schema';

// Helper to fetch current settings row (if any)
const fetchSettings = async () => {
  const rows = await db.select().from(pomodoroSettingsTable).limit(1).execute();
  return rows[0] ?? null;
};

describe('updatePomodoroSettings handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a settings row when none exists and updates provided fields', async () => {
    // Ensure DB has no settings initially
    let before = await fetchSettings();
    expect(before).toBeNull();

    const input: UpdatePomodoroSettingsInput = { work_minutes: 30 };
    await updatePomodoroSettings(input);

    const after = await fetchSettings();
    expect(after).not.toBeNull();
    // work_minutes should be updated, break_minutes remains default (5)
    expect(after!.work_minutes).toBe(30);
    expect(after!.break_minutes).toBe(5);
    expect(after!.id).toBeDefined();
    expect(after!.created_at).toBeInstanceOf(Date);
  });

  it('updates both work and break minutes when a row already exists', async () => {
    // Insert an initial default row directly
    const inserted = await db.insert(pomodoroSettingsTable).values({}).returning().execute();
    const original = inserted[0];
    expect(original.work_minutes).toBe(25); // default
    expect(original.break_minutes).toBe(5);

    const input: UpdatePomodoroSettingsInput = { work_minutes: 45, break_minutes: 10 };
    await updatePomodoroSettings(input);

    const updated = await fetchSettings();
    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(original.id);
    expect(updated!.work_minutes).toBe(45);
    expect(updated!.break_minutes).toBe(10);
  });

  it('does nothing when no fields are provided', async () => {
    // Insert a row first
    const inserted = await db.insert(pomodoroSettingsTable).values({ work_minutes: 20, break_minutes: 7 }).returning().execute();
    const original = inserted[0];

    const input: UpdatePomodoroSettingsInput = {};
    await updatePomodoroSettings(input);

    const after = await fetchSettings();
    expect(after).not.toBeNull();
    // Values should stay unchanged
    expect(after!.work_minutes).toBe(original.work_minutes);
    expect(after!.break_minutes).toBe(original.break_minutes);
    expect(after!.id).toBe(original.id);
  });
});
