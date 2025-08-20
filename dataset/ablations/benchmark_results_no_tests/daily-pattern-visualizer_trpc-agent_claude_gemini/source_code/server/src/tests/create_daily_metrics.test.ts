import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type CreateDailyMetricsInput } from '../schema';
import { createDailyMetrics } from '../handlers/create_daily_metrics';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDailyMetricsInput = {
  date: '2024-01-15',
  sleep_duration: 8.5,
  work_hours: 6.0,
  social_interaction_time: 2.5,
  screen_time: 4.0,
  emotional_energy_level: 7,
  notes: 'Productive day with good sleep'
};

// Minimal test input
const minimalInput: CreateDailyMetricsInput = {
  date: '2024-01-16',
  sleep_duration: 7.0,
  work_hours: 8.0,
  social_interaction_time: 1.0,
  screen_time: 3.0,
  emotional_energy_level: 5
};

describe('createDailyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create daily metrics with all fields', async () => {
    const result = await createDailyMetrics(testInput);

    // Basic field validation
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().substring(0, 10)).toEqual('2024-01-15');
    expect(result.sleep_duration).toEqual(8.5);
    expect(result.work_hours).toEqual(6.0);
    expect(result.social_interaction_time).toEqual(2.5);
    expect(result.screen_time).toEqual(4.0);
    expect(result.emotional_energy_level).toEqual(7);
    expect(result.notes).toEqual('Productive day with good sleep');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create daily metrics without notes', async () => {
    const result = await createDailyMetrics(minimalInput);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().substring(0, 10)).toEqual('2024-01-16');
    expect(result.sleep_duration).toEqual(7.0);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_interaction_time).toEqual(1.0);
    expect(result.screen_time).toEqual(3.0);
    expect(result.emotional_energy_level).toEqual(5);
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save daily metrics to database', async () => {
    const result = await createDailyMetrics(testInput);

    // Query using proper drizzle syntax
    const metrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, result.id))
      .execute();

    expect(metrics).toHaveLength(1);
    expect(metrics[0].date).toEqual('2024-01-15');
    expect(metrics[0].sleep_duration).toEqual(8.5);
    expect(metrics[0].work_hours).toEqual(6.0);
    expect(metrics[0].social_interaction_time).toEqual(2.5);
    expect(metrics[0].screen_time).toEqual(4.0);
    expect(metrics[0].emotional_energy_level).toEqual(7);
    expect(metrics[0].notes).toEqual('Productive day with good sleep');
    expect(metrics[0].created_at).toBeInstanceOf(Date);
    expect(metrics[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique date constraint', async () => {
    // Create first metrics entry for a date
    await createDailyMetrics(testInput);

    // Try to create another entry for the same date
    const duplicateInput: CreateDailyMetricsInput = {
      date: '2024-01-15', // Same date
      sleep_duration: 7.0,
      work_hours: 5.0,
      social_interaction_time: 3.0,
      screen_time: 6.0,
      emotional_energy_level: 6,
      notes: 'Different data for same date'
    };

    // Should throw error due to unique constraint violation
    expect(createDailyMetrics(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle boundary values correctly', async () => {
    const boundaryInput: CreateDailyMetricsInput = {
      date: '2024-01-17',
      sleep_duration: 0.0, // Minimum
      work_hours: 24.0, // Maximum
      social_interaction_time: 12.5, // Mid-range decimal
      screen_time: 0.1, // Small decimal
      emotional_energy_level: 1, // Minimum energy
      notes: null
    };

    const result = await createDailyMetrics(boundaryInput);

    expect(result.sleep_duration).toEqual(0.0);
    expect(result.work_hours).toEqual(24.0);
    expect(result.social_interaction_time).toEqual(12.5);
    expect(result.screen_time).toEqual(0.1);
    expect(result.emotional_energy_level).toEqual(1);
    expect(result.notes).toBeNull();
  });

  it('should handle maximum energy level', async () => {
    const maxEnergyInput: CreateDailyMetricsInput = {
      date: '2024-01-18',
      sleep_duration: 8.0,
      work_hours: 8.0,
      social_interaction_time: 4.0,
      screen_time: 2.0,
      emotional_energy_level: 10 // Maximum energy
    };

    const result = await createDailyMetrics(maxEnergyInput);

    expect(result.emotional_energy_level).toEqual(10);
    expect(result.date.toISOString().substring(0, 10)).toEqual('2024-01-18');
  });
});
