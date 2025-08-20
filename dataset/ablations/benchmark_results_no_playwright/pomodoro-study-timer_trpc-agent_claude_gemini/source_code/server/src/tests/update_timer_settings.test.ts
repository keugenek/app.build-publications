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

  it('should create new timer settings when none exist', async () => {
    const input: UpdateTimerSettingsInput = {
      work_duration: 30,
      break_duration: 10
    };

    const result = await updateTimerSettings(input);

    // Verify returned data
    expect(result.id).toBe(1);
    expect(result.work_duration).toBe(30);
    expect(result.break_duration).toBe(10);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save settings to database when creating new', async () => {
    const input: UpdateTimerSettingsInput = {
      work_duration: 45,
      break_duration: 15
    };

    await updateTimerSettings(input);

    // Query database to verify record was created
    const settings = await db.select()
      .from(timerSettingsTable)
      .where(eq(timerSettingsTable.id, 1))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].work_duration).toBe(45);
    expect(settings[0].break_duration).toBe(15);
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing timer settings', async () => {
    // Create initial settings
    await db.insert(timerSettingsTable)
      .values({
        id: 1,
        work_duration: 25,
        break_duration: 5
      })
      .execute();

    // Update settings
    const input: UpdateTimerSettingsInput = {
      work_duration: 50,
      break_duration: 20
    };

    const result = await updateTimerSettings(input);

    // Verify returned data
    expect(result.id).toBe(1);
    expect(result.work_duration).toBe(50);
    expect(result.break_duration).toBe(20);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial settings
    await db.insert(timerSettingsTable)
      .values({
        id: 1,
        work_duration: 25,
        break_duration: 5
      })
      .execute();

    // Update only work duration
    const input: UpdateTimerSettingsInput = {
      work_duration: 35
      // break_duration is not provided
    };

    const result = await updateTimerSettings(input);

    // Verify work_duration was updated but break_duration remained unchanged
    expect(result.work_duration).toBe(35);
    expect(result.break_duration).toBe(5); // Should remain unchanged
  });

  it('should update only break duration when work duration not provided', async () => {
    // Create initial settings
    await db.insert(timerSettingsTable)
      .values({
        id: 1,
        work_duration: 25,
        break_duration: 5
      })
      .execute();

    // Update only break duration
    const input: UpdateTimerSettingsInput = {
      break_duration: 12
      // work_duration is not provided
    };

    const result = await updateTimerSettings(input);

    // Verify break_duration was updated but work_duration remained unchanged
    expect(result.work_duration).toBe(25); // Should remain unchanged
    expect(result.break_duration).toBe(12);
  });

  it('should use defaults when creating new settings with partial input', async () => {
    const input: UpdateTimerSettingsInput = {
      work_duration: 40
      // break_duration is not provided
    };

    const result = await updateTimerSettings(input);

    // When creating new record, should use default for break_duration
    expect(result.work_duration).toBe(40);
    expect(result.break_duration).toBe(5); // Default value
  });

  it('should update updated_at timestamp', async () => {
    // Create initial settings
    const initialResult = await db.insert(timerSettingsTable)
      .values({
        id: 1,
        work_duration: 25,
        break_duration: 5
      })
      .returning()
      .execute();

    const initialUpdatedAt = initialResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update settings
    const input: UpdateTimerSettingsInput = {
      work_duration: 30
    };

    const result = await updateTimerSettings(input);

    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
  });

  it('should handle empty input object', async () => {
    const input: UpdateTimerSettingsInput = {};

    const result = await updateTimerSettings(input);

    // Should create new settings with defaults
    expect(result.work_duration).toBe(25); // Default value
    expect(result.break_duration).toBe(5); // Default value
    expect(result.id).toBe(1);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle updating existing settings with empty input', async () => {
    // Create initial settings
    await db.insert(timerSettingsTable)
      .values({
        id: 1,
        work_duration: 60,
        break_duration: 15
      })
      .execute();

    const input: UpdateTimerSettingsInput = {};

    const result = await updateTimerSettings(input);

    // Should keep existing values when no updates provided
    expect(result.work_duration).toBe(60); // Should remain unchanged
    expect(result.break_duration).toBe(15); // Should remain unchanged
  });
});
