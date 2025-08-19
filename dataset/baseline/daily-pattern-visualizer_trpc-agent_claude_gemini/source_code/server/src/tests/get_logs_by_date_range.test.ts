import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type GetLogsByDateRangeInput } from '../schema';
import { getLogsByDateRange } from '../handlers/get_logs_by_date_range';

describe('getLogsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return logs within date range ordered by date', async () => {
    // Create test data spanning multiple dates
    await db.insert(dailyLogsTable)
      .values([
        {
          date: '2024-01-15',
          sleep_duration: 8.0,
          work_hours: 8.0,
          social_time: 2.0,
          screen_time: 6.0,
          emotional_energy: 7
        },
        {
          date: '2024-01-14',
          sleep_duration: 7.5,
          work_hours: 9.0,
          social_time: 1.5,
          screen_time: 8.0,
          emotional_energy: 5
        },
        {
          date: '2024-01-16',
          sleep_duration: 6.5,
          work_hours: 7.5,
          social_time: 3.0,
          screen_time: 5.5,
          emotional_energy: 8
        },
        {
          date: '2024-01-13', // Outside range
          sleep_duration: 8.5,
          work_hours: 6.0,
          social_time: 4.0,
          screen_time: 4.0,
          emotional_energy: 9
        }
      ])
      .execute();

    const input: GetLogsByDateRangeInput = {
      start_date: '2024-01-14',
      end_date: '2024-01-16'
    };

    const result = await getLogsByDateRange(input);

    // Should return 3 logs within the range, ordered by date
    expect(result).toHaveLength(3);
    
    // Verify correct ordering (ascending by date)
    expect(result[0].date).toEqual(new Date('2024-01-14'));
    expect(result[1].date).toEqual(new Date('2024-01-15'));
    expect(result[2].date).toEqual(new Date('2024-01-16'));

    // Verify numeric type conversions
    expect(typeof result[0].sleep_duration).toBe('number');
    expect(typeof result[0].work_hours).toBe('number');
    expect(typeof result[0].social_time).toBe('number');
    expect(typeof result[0].screen_time).toBe('number');

    // Verify specific values
    expect(result[0].sleep_duration).toEqual(7.5);
    expect(result[0].work_hours).toEqual(9.0);
    expect(result[0].emotional_energy).toEqual(5);
  });

  it('should return empty array when no logs exist in date range', async () => {
    // Create data outside the query range
    await db.insert(dailyLogsTable)
      .values({
        date: '2024-01-10',
        sleep_duration: 8.0,
        work_hours: 8.0,
        social_time: 2.0,
        screen_time: 6.0,
        emotional_energy: 7
      })
      .execute();

    const input: GetLogsByDateRangeInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-20'
    };

    const result = await getLogsByDateRange(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle single date range correctly', async () => {
    await db.insert(dailyLogsTable)
      .values([
        {
          date: '2024-01-15',
          sleep_duration: 8.0,
          work_hours: 8.0,
          social_time: 2.0,
          screen_time: 6.0,
          emotional_energy: 7
        },
        {
          date: '2024-01-14',
          sleep_duration: 7.0,
          work_hours: 9.0,
          social_time: 1.0,
          screen_time: 8.0,
          emotional_energy: 5
        }
      ])
      .execute();

    // Query for a single date
    const input: GetLogsByDateRangeInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    };

    const result = await getLogsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[0].sleep_duration).toEqual(8.0);
  });

  it('should handle date range boundaries inclusively', async () => {
    await db.insert(dailyLogsTable)
      .values([
        {
          date: '2024-01-14', // Should be included (start boundary)
          sleep_duration: 7.0,
          work_hours: 8.0,
          social_time: 2.0,
          screen_time: 6.0,
          emotional_energy: 6
        },
        {
          date: '2024-01-16', // Should be included (end boundary)
          sleep_duration: 8.0,
          work_hours: 7.0,
          social_time: 3.0,
          screen_time: 5.0,
          emotional_energy: 8
        },
        {
          date: '2024-01-13', // Should be excluded (before start)
          sleep_duration: 6.0,
          work_hours: 9.0,
          social_time: 1.0,
          screen_time: 7.0,
          emotional_energy: 4
        },
        {
          date: '2024-01-17', // Should be excluded (after end)
          sleep_duration: 9.0,
          work_hours: 6.0,
          social_time: 4.0,
          screen_time: 4.0,
          emotional_energy: 9
        }
      ])
      .execute();

    const input: GetLogsByDateRangeInput = {
      start_date: '2024-01-14',
      end_date: '2024-01-16'
    };

    const result = await getLogsByDateRange(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-14'));
    expect(result[1].date).toEqual(new Date('2024-01-16'));
  });

  it('should preserve all log fields correctly', async () => {
    await db.insert(dailyLogsTable)
      .values({
        date: '2024-01-15',
        sleep_duration: 7.5,
        work_hours: 8.25,
        social_time: 2.75,
        screen_time: 6.5,
        emotional_energy: 7
      })
      .execute();

    const input: GetLogsByDateRangeInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    };

    const result = await getLogsByDateRange(input);

    expect(result).toHaveLength(1);
    const log = result[0];
    
    // Verify all fields are present and correct
    expect(log.id).toBeDefined();
    expect(log.date).toEqual(new Date('2024-01-15'));
    expect(log.sleep_duration).toEqual(7.5);
    expect(log.work_hours).toEqual(8.25);
    expect(log.social_time).toEqual(2.75);
    expect(log.screen_time).toEqual(6.5);
    expect(log.emotional_energy).toEqual(7);
    expect(log.created_at).toBeInstanceOf(Date);
    expect(log.updated_at).toBeInstanceOf(Date);
  });
});
