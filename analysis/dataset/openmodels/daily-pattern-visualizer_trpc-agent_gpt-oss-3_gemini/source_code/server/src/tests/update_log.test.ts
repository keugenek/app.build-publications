import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { logsTable } from '../db/schema';
import { type UpdateLogInput } from '../schema';
import { updateLog } from '../handlers/update_log';
import { eq } from 'drizzle-orm';

/** Helper to insert a log directly into the database */
async function insertLog(overrides?: Partial<{}>) {
  const base = {
    date: '2023-01-01',
    sleep_duration: '8.00',
    work_hours: '5.00',
    social_time: '2.00',
    screen_time: '3.00',
    emotional_energy: 7,
    // created_at will default
  } as const;
  const result = await db
    .insert(logsTable)
    .values({ ...base, ...overrides })
    .returning()
    .execute();
  return result[0];
}

describe('updateLog handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and returns the updated log', async () => {
    const original = await insertLog();

    const input: UpdateLogInput = {
      id: original.id,
      sleep_duration: 7.5,
      emotional_energy: 9
    };

    const updated = await updateLog(input);

    // Verify updated fields
    expect(updated.id).toBe(original.id);
    expect(updated.sleep_duration).toBeCloseTo(7.5);
    expect(updated.emotional_energy).toBe(9);
    // Unchanged fields should retain original values (converted to numbers)
    expect(updated.work_hours).toBeCloseTo(parseFloat(original.work_hours as any));
    expect(updated.social_time).toBeCloseTo(parseFloat(original.social_time as any));
    expect(updated.screen_time).toBeCloseTo(parseFloat(original.screen_time as any));
    // Date should stay the same
    expect(updated.date.getTime()).toBe(new Date(original.date).getTime());
  });

  it('returns the existing log when no fields are provided', async () => {
    const original = await insertLog();
    const input: UpdateLogInput = { id: original.id };
    const result = await updateLog(input);

    // All fields should match the original values (converted where needed)
    expect(result.id).toBe(original.id);
    expect(result.sleep_duration).toBeCloseTo(parseFloat(original.sleep_duration as any));
    expect(result.work_hours).toBeCloseTo(parseFloat(original.work_hours as any));
    expect(result.social_time).toBeCloseTo(parseFloat(original.social_time as any));
    expect(result.screen_time).toBeCloseTo(parseFloat(original.screen_time as any));
    expect(result.emotional_energy).toBe(original.emotional_energy);
    expect(result.date.getTime()).toBe(new Date(original.date).getTime());
  });

  it('throws an error when the log does not exist', async () => {
    const input: UpdateLogInput = { id: 9999, sleep_duration: 6 };
    await expect(updateLog(input)).rejects.toThrow('Log with id 9999 not found');
  });
});
