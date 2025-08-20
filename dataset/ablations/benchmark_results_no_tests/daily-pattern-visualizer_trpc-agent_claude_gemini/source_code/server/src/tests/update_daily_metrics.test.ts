import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type UpdateDailyMetricsInput, type CreateDailyMetricsInput } from '../schema';
import { updateDailyMetrics } from '../handlers/update_daily_metrics';
import { eq } from 'drizzle-orm';

// Helper function to create initial daily metrics
const createInitialMetrics = async (): Promise<number> => {
  const result = await db.insert(dailyMetricsTable)
    .values({
      date: '2024-01-15',
      sleep_duration: 8.0,
      work_hours: 6.0,
      social_interaction_time: 2.0,
      screen_time: 4.0,
      emotional_energy_level: 7,
      notes: 'Initial notes'
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateDailyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of existing daily metrics', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 7.5,
      work_hours: 8.0,
      social_interaction_time: 1.5,
      screen_time: 5.0,
      emotional_energy_level: 8,
      notes: 'Updated notes'
    };

    const result = await updateDailyMetrics(updateInput);

    // Verify all fields were updated correctly
    expect(result.id).toEqual(metricsId);
    expect(result.sleep_duration).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_interaction_time).toEqual(1.5);
    expect(result.screen_time).toEqual(5.0);
    expect(result.emotional_energy_level).toEqual(8);
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.sleep_duration).toBe('number');
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.social_interaction_time).toBe('number');
    expect(typeof result.screen_time).toBe('number');
  });

  it('should update only specific fields when provided', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 9.0,
      emotional_energy_level: 9
    };

    const result = await updateDailyMetrics(updateInput);

    // Verify only specified fields were updated
    expect(result.sleep_duration).toEqual(9.0);
    expect(result.emotional_energy_level).toEqual(9);
    
    // Verify other fields remain unchanged
    expect(result.work_hours).toEqual(6.0);
    expect(result.social_interaction_time).toEqual(2.0);
    expect(result.screen_time).toEqual(4.0);
    expect(result.notes).toEqual('Initial notes');
  });

  it('should update notes to null', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      notes: null
    };

    const result = await updateDailyMetrics(updateInput);

    expect(result.notes).toBeNull();
    // Verify other fields remain unchanged
    expect(result.sleep_duration).toEqual(8.0);
    expect(result.work_hours).toEqual(6.0);
  });

  it('should preserve created_at timestamp but update updated_at', async () => {
    const metricsId = await createInitialMetrics();

    // Get original timestamps
    const original = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, metricsId))
      .execute();

    const originalCreatedAt = original[0].created_at;
    const originalUpdatedAt = original[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 7.0
    };

    const result = await updateDailyMetrics(updateInput);

    // created_at should be preserved
    expect(result.created_at).toEqual(originalCreatedAt);
    // updated_at should be newer
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
  });

  it('should save changes to database', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 6.5,
      work_hours: 9.0,
      notes: 'Database test notes'
    };

    await updateDailyMetrics(updateInput);

    // Verify changes were persisted
    const savedMetrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, metricsId))
      .execute();

    expect(savedMetrics).toHaveLength(1);
    expect(parseFloat(savedMetrics[0].sleep_duration as any)).toEqual(6.5);
    expect(parseFloat(savedMetrics[0].work_hours as any)).toEqual(9.0);
    expect(savedMetrics[0].notes).toEqual('Database test notes');
    
    // Verify unchanged fields
    expect(parseFloat(savedMetrics[0].social_interaction_time as any)).toEqual(2.0);
    expect(parseFloat(savedMetrics[0].screen_time as any)).toEqual(4.0);
    expect(savedMetrics[0].emotional_energy_level).toEqual(7);
  });

  it('should throw error when metrics entry does not exist', async () => {
    const updateInput: UpdateDailyMetricsInput = {
      id: 999, // Non-existent ID
      sleep_duration: 8.0
    };

    await expect(updateDailyMetrics(updateInput))
      .rejects
      .toThrow(/Daily metrics with id 999 not found/i);
  });

  it('should handle boundary values correctly', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 0,
      work_hours: 24,
      social_interaction_time: 0,
      screen_time: 24,
      emotional_energy_level: 1
    };

    const result = await updateDailyMetrics(updateInput);

    expect(result.sleep_duration).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_interaction_time).toEqual(0);
    expect(result.screen_time).toEqual(24);
    expect(result.emotional_energy_level).toEqual(1);
  });

  it('should handle decimal values correctly', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      sleep_duration: 7.25,
      work_hours: 6.75,
      social_interaction_time: 1.33,
      screen_time: 3.67
    };

    const result = await updateDailyMetrics(updateInput);

    expect(result.sleep_duration).toEqual(7.25);
    expect(result.work_hours).toEqual(6.75);
    expect(result.social_interaction_time).toEqual(1.33);
    expect(result.screen_time).toEqual(3.67);
  });

  it('should handle empty string notes', async () => {
    const metricsId = await createInitialMetrics();

    const updateInput: UpdateDailyMetricsInput = {
      id: metricsId,
      notes: ''
    };

    const result = await updateDailyMetrics(updateInput);

    expect(result.notes).toEqual('');
  });
});
