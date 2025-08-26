import { beforeEach, afterEach, describe, it, expect } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updatePomodoroSettings } from '../handlers/update_pomodoro_settings';
import { type UpdatePomodoroSettingsInput } from '../schema';

/**
 * Helper to create a settings row directly via db.
 */
const createSettings = async (work_interval: number, break_interval: number) => {
  const result = await db
    .insert(pomodoroSettingsTable)
    .values({ work_interval, break_interval })
    .returning()
    .execute();
  return result[0];
};

describe('updatePomodoroSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates only provided fields and retains others', async () => {
    const original = await createSettings(30, 10);
    const input: UpdatePomodoroSettingsInput = {
      id: original.id,
      work_interval: 45, // change work interval only
    };
    const updated = await updatePomodoroSettings(input);

    expect(updated.id).toBe(original.id);
    expect(updated.work_interval).toBe(45);
    // break_interval should stay the same as original since not provided
    expect(updated.break_interval).toBe(10);
  });

  it('updates both fields when both provided', async () => {
    const original = await createSettings(25, 5);
    const input: UpdatePomodoroSettingsInput = {
      id: original.id,
      work_interval: 20,
      break_interval: 7,
    };
    const updated = await updatePomodoroSettings(input);
    expect(updated.work_interval).toBe(20);
    expect(updated.break_interval).toBe(7);
  });

  it('throws when id does not exist', async () => {
    const input: UpdatePomodoroSettingsInput = {
      id: 9999,
      work_interval: 15,
    };
    await expect(updatePomodoroSettings(input)).rejects.toThrow(/not found/i);
  });
});
