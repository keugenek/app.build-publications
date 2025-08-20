import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { getMetricsByDate } from '../handlers/get_metrics_by_date';

describe('getMetricsByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no metrics exist for the date', async () => {
    const date = new Date('2023-01-01');
    const result = await getMetricsByDate(date);
    expect(result).toBeNull();
  });

  it('should return metrics when they exist for the date', async () => {
    // First, insert a test record
    const testDate = new Date('2023-01-01');
    const inserted = await db.insert(dailyMetricsTable)
      .values({
        date: testDate.toISOString().split('T')[0],
        sleep_duration: '7.50',
        work_hours: '8.00',
        social_time: '2.50',
        screen_time: '4.00',
        emotional_energy: 7
      })
      .returning()
      .execute();

    const result = await getMetricsByDate(testDate);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(inserted[0].id);
    expect(result?.date).toEqual(testDate);
    expect(result?.sleep_duration).toEqual(7.5);
    expect(result?.work_hours).toEqual(8.0);
    expect(result?.social_time).toEqual(2.5);
    expect(result?.screen_time).toEqual(4.0);
    expect(result?.emotional_energy).toEqual(7);
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should handle dates without time components correctly', async () => {
    // Insert with a date
    const testDate = new Date('2023-01-02');
    // Set time to ensure we're testing date-only matching
    const dateWithTime = new Date('2023-01-02T15:30:00Z');
    
    await db.insert(dailyMetricsTable)
      .values({
        date: testDate.toISOString().split('T')[0],
        sleep_duration: '6.25',
        work_hours: '7.50',
        social_time: '3.00',
        screen_time: '5.25',
        emotional_energy: 8
      })
      .execute();

    const result = await getMetricsByDate(dateWithTime);
    
    expect(result).not.toBeNull();
    expect(result?.sleep_duration).toEqual(6.25);
    expect(result?.emotional_energy).toEqual(8);
  });
});
