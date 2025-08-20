import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type GetMetricsByDateRangeInput } from '../schema';
import { getMetricsByDateRange } from '../handlers/get_metrics_by_date_range';

// Test data for multiple dates
const testMetrics = [
  {
    date: '2024-01-10',
    sleep_duration: 7.5,
    work_hours: 8.0,
    social_interaction_time: 2.5,
    screen_time: 6.0,
    emotional_energy_level: 7,
    notes: 'Good productive day'
  },
  {
    date: '2024-01-11',
    sleep_duration: 6.5,
    work_hours: 9.5,
    social_interaction_time: 1.0,
    screen_time: 7.5,
    emotional_energy_level: 5,
    notes: 'Long work day, tired'
  },
  {
    date: '2024-01-12',
    sleep_duration: 8.0,
    work_hours: 7.0,
    social_interaction_time: 3.0,
    screen_time: 5.5,
    emotional_energy_level: 8,
    notes: 'Well-rested and balanced'
  },
  {
    date: '2024-01-15', // Gap in dates - outside some test ranges
    sleep_duration: 7.0,
    work_hours: 8.5,
    social_interaction_time: 2.0,
    screen_time: 6.5,
    emotional_energy_level: 6,
    notes: 'Back to work after weekend'
  }
];

describe('getMetricsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return metrics for a single date range', async () => {
    // Insert test data
    await db.insert(dailyMetricsTable).values([
      {
        date: testMetrics[0].date,
        sleep_duration: testMetrics[0].sleep_duration,
        work_hours: testMetrics[0].work_hours,
        social_interaction_time: testMetrics[0].social_interaction_time,
        screen_time: testMetrics[0].screen_time,
        emotional_energy_level: testMetrics[0].emotional_energy_level,
        notes: testMetrics[0].notes
      }
    ]).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-10'
    };

    const result = await getMetricsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[0].sleep_duration).toEqual(7.5);
    expect(result[0].work_hours).toEqual(8.0);
    expect(result[0].social_interaction_time).toEqual(2.5);
    expect(result[0].screen_time).toEqual(6.0);
    expect(result[0].emotional_energy_level).toEqual(7);
    expect(result[0].notes).toEqual('Good productive day');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple metrics in date ascending order', async () => {
    // Insert test data for multiple dates
    await db.insert(dailyMetricsTable).values(
      testMetrics.map(metric => ({
        date: metric.date,
        sleep_duration: metric.sleep_duration,
        work_hours: metric.work_hours,
        social_interaction_time: metric.social_interaction_time,
        screen_time: metric.screen_time,
        emotional_energy_level: metric.emotional_energy_level,
        notes: metric.notes
      }))
    ).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-12'
    };

    const result = await getMetricsByDateRange(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering by date ascending
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[1].date).toEqual(new Date('2024-01-11'));
    expect(result[2].date).toEqual(new Date('2024-01-12'));

    // Verify numeric conversions for first result
    expect(typeof result[0].sleep_duration).toBe('number');
    expect(typeof result[0].work_hours).toBe('number');
    expect(typeof result[0].social_interaction_time).toBe('number');
    expect(typeof result[0].screen_time).toBe('number');
    expect(result[0].sleep_duration).toEqual(7.5);
    expect(result[0].work_hours).toEqual(8.0);

    // Verify content for specific dates
    expect(result[1].sleep_duration).toEqual(6.5);
    expect(result[1].work_hours).toEqual(9.5);
    expect(result[1].emotional_energy_level).toEqual(5);
    expect(result[1].notes).toEqual('Long work day, tired');
  });

  it('should return empty array when no metrics exist in range', async () => {
    // Insert data outside the query range
    await db.insert(dailyMetricsTable).values([
      {
        date: '2024-01-01',
        sleep_duration: testMetrics[0].sleep_duration,
        work_hours: testMetrics[0].work_hours,
        social_interaction_time: testMetrics[0].social_interaction_time,
        screen_time: testMetrics[0].screen_time,
        emotional_energy_level: testMetrics[0].emotional_energy_level,
        notes: testMetrics[0].notes
      }
    ]).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-12'
    };

    const result = await getMetricsByDateRange(input);
    expect(result).toHaveLength(0);
  });

  it('should handle inclusive date range correctly', async () => {
    // Insert data for boundary dates and one day outside
    await db.insert(dailyMetricsTable).values([
      {
        date: '2024-01-09', // One day before range
        sleep_duration: 6.0,
        work_hours: 8.0,
        social_interaction_time: 2.0,
        screen_time: 5.0,
        emotional_energy_level: 7,
        notes: 'Before range'
      },
      {
        date: '2024-01-10', // Start of range
        sleep_duration: testMetrics[0].sleep_duration,
        work_hours: testMetrics[0].work_hours,
        social_interaction_time: testMetrics[0].social_interaction_time,
        screen_time: testMetrics[0].screen_time,
        emotional_energy_level: testMetrics[0].emotional_energy_level,
        notes: testMetrics[0].notes
      },
      {
        date: '2024-01-11', // Middle of range
        sleep_duration: testMetrics[1].sleep_duration,
        work_hours: testMetrics[1].work_hours,
        social_interaction_time: testMetrics[1].social_interaction_time,
        screen_time: testMetrics[1].screen_time,
        emotional_energy_level: testMetrics[1].emotional_energy_level,
        notes: testMetrics[1].notes
      },
      {
        date: '2024-01-12', // End of range
        sleep_duration: testMetrics[2].sleep_duration,
        work_hours: testMetrics[2].work_hours,
        social_interaction_time: testMetrics[2].social_interaction_time,
        screen_time: testMetrics[2].screen_time,
        emotional_energy_level: testMetrics[2].emotional_energy_level,
        notes: testMetrics[2].notes
      },
      {
        date: '2024-01-13', // One day after range
        sleep_duration: 7.0,
        work_hours: 8.0,
        social_interaction_time: 2.0,
        screen_time: 6.0,
        emotional_energy_level: 6,
        notes: 'After range'
      }
    ]).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-12'
    };

    const result = await getMetricsByDateRange(input);

    // Should only include dates within the inclusive range
    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[1].date).toEqual(new Date('2024-01-11'));
    expect(result[2].date).toEqual(new Date('2024-01-12'));

    // Verify none of the boundary dates are included
    expect(result.find(r => r.notes === 'Before range')).toBeUndefined();
    expect(result.find(r => r.notes === 'After range')).toBeUndefined();
  });

  it('should handle metrics with null notes correctly', async () => {
    await db.insert(dailyMetricsTable).values([
      {
        date: '2024-01-10',
        sleep_duration: testMetrics[0].sleep_duration,
        work_hours: testMetrics[0].work_hours,
        social_interaction_time: testMetrics[0].social_interaction_time,
        screen_time: testMetrics[0].screen_time,
        emotional_energy_level: testMetrics[0].emotional_energy_level,
        notes: null // Null notes
      }
    ]).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-10'
    };

    const result = await getMetricsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].sleep_duration).toEqual(7.5);
  });

  it('should handle wide date range spanning multiple weeks', async () => {
    // Insert data across a longer time period
    await db.insert(dailyMetricsTable).values(
      testMetrics.map(metric => ({
        date: metric.date,
        sleep_duration: metric.sleep_duration,
        work_hours: metric.work_hours,
        social_interaction_time: metric.social_interaction_time,
        screen_time: metric.screen_time,
        emotional_energy_level: metric.emotional_energy_level,
        notes: metric.notes
      }))
    ).execute();

    const input: GetMetricsByDateRangeInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    };

    const result = await getMetricsByDateRange(input);

    // Should return all test data since all dates are within January 2024
    expect(result).toHaveLength(4);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[3].date).toEqual(new Date('2024-01-15'));
  });
});
