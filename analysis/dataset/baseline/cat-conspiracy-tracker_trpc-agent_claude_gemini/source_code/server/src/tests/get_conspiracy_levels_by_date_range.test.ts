import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyConspiracyLevelsTable } from '../db/schema';
import { type GetConspiracyLevelsByDateRangeInput } from '../schema';
import { getConspiracyLevelsByDateRange } from '../handlers/get_conspiracy_levels_by_date_range';

describe('getConspiracyLevelsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conspiracy levels within date range', async () => {
    // Create test data spanning multiple dates
    const testDate1 = new Date('2024-01-15');
    const testDate2 = new Date('2024-01-16');
    const testDate3 = new Date('2024-01-17');

    await db.insert(dailyConspiracyLevelsTable).values([
      {
        date: testDate1.toISOString().split('T')[0],
        total_conspiracy_score: 25,
        activity_count: 5
      },
      {
        date: testDate2.toISOString().split('T')[0],
        total_conspiracy_score: 40,
        activity_count: 8
      },
      {
        date: testDate3.toISOString().split('T')[0],
        total_conspiracy_score: 15,
        activity_count: 3
      }
    ]).execute();

    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: testDate1,
      end_date: testDate3
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(3);

    // Results should be ordered by date descending (newest first)
    expect(results[0].date.getTime()).toEqual(testDate3.getTime());
    expect(results[0].total_conspiracy_score).toEqual(15);
    expect(results[0].activity_count).toEqual(3);

    expect(results[1].date.getTime()).toEqual(testDate2.getTime());
    expect(results[1].total_conspiracy_score).toEqual(40);
    expect(results[1].activity_count).toEqual(8);

    expect(results[2].date.getTime()).toEqual(testDate1.getTime());
    expect(results[2].total_conspiracy_score).toEqual(25);
    expect(results[2].activity_count).toEqual(5);

    // Verify all results have proper structure
    results.forEach(result => {
      expect(result.id).toBeDefined();
      expect(result.date).toBeInstanceOf(Date);
      expect(typeof result.total_conspiracy_score).toBe('number');
      expect(typeof result.activity_count).toBe('number');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return partial results for partial date range overlap', async () => {
    // Create test data
    const testDate1 = new Date('2024-01-10');
    const testDate2 = new Date('2024-01-15');
    const testDate3 = new Date('2024-01-20');

    await db.insert(dailyConspiracyLevelsTable).values([
      {
        date: testDate1.toISOString().split('T')[0],
        total_conspiracy_score: 30,
        activity_count: 6
      },
      {
        date: testDate2.toISOString().split('T')[0],
        total_conspiracy_score: 45,
        activity_count: 9
      },
      {
        date: testDate3.toISOString().split('T')[0],
        total_conspiracy_score: 20,
        activity_count: 4
      }
    ]).execute();

    // Query for a range that only includes middle date
    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-18')
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].date.getTime()).toEqual(testDate2.getTime());
    expect(results[0].total_conspiracy_score).toEqual(45);
    expect(results[0].activity_count).toEqual(9);
  });

  it('should return empty array when no data exists in date range', async () => {
    // Create test data outside the query range
    const testDate = new Date('2024-01-01');
    await db.insert(dailyConspiracyLevelsTable).values({
      date: testDate.toISOString().split('T')[0],
      total_conspiracy_score: 10,
      activity_count: 2
    }).execute();

    // Query for a different date range
    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should handle single date range correctly', async () => {
    // Create test data for a specific date
    const testDate = new Date('2024-01-15');
    await db.insert(dailyConspiracyLevelsTable).values({
      date: testDate.toISOString().split('T')[0],
      total_conspiracy_score: 35,
      activity_count: 7
    }).execute();

    // Query for the exact same start and end date
    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: testDate,
      end_date: testDate
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].date.getTime()).toEqual(testDate.getTime());
    expect(results[0].total_conspiracy_score).toEqual(35);
    expect(results[0].activity_count).toEqual(7);
  });

  it('should maintain correct date ordering with multiple entries', async () => {
    // Create test data with dates in random insertion order
    const dates = [
      new Date('2024-01-20'),
      new Date('2024-01-10'),
      new Date('2024-01-25'),
      new Date('2024-01-15'),
      new Date('2024-01-05')
    ];

    const insertData = dates.map((date, index) => ({
      date: date.toISOString().split('T')[0],
      total_conspiracy_score: (index + 1) * 10,
      activity_count: index + 1
    }));

    await db.insert(dailyConspiracyLevelsTable).values(insertData).execute();

    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(5);

    // Verify descending order (newest first)
    expect(results[0].date.getTime()).toEqual(new Date('2024-01-25').getTime());
    expect(results[1].date.getTime()).toEqual(new Date('2024-01-20').getTime());
    expect(results[2].date.getTime()).toEqual(new Date('2024-01-15').getTime());
    expect(results[3].date.getTime()).toEqual(new Date('2024-01-10').getTime());
    expect(results[4].date.getTime()).toEqual(new Date('2024-01-05').getTime());

    // Verify that dates are properly ordered
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].date.getTime()).toBeGreaterThan(results[i + 1].date.getTime());
    }
  });

  it('should handle boundary dates correctly', async () => {
    // Create test data on boundary dates
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-17');

    await db.insert(dailyConspiracyLevelsTable).values([
      {
        date: '2024-01-14', // Day before start
        total_conspiracy_score: 10,
        activity_count: 2
      },
      {
        date: startDate.toISOString().split('T')[0], // Start date
        total_conspiracy_score: 20,
        activity_count: 4
      },
      {
        date: '2024-01-16', // Middle date
        total_conspiracy_score: 30,
        activity_count: 6
      },
      {
        date: endDate.toISOString().split('T')[0], // End date
        total_conspiracy_score: 40,
        activity_count: 8
      },
      {
        date: '2024-01-18', // Day after end
        total_conspiracy_score: 50,
        activity_count: 10
      }
    ]).execute();

    const input: GetConspiracyLevelsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate
    };

    const results = await getConspiracyLevelsByDateRange(input);

    expect(results).toHaveLength(3);

    // Should include start date, middle date, and end date
    const resultDates = results.map(r => r.date.toISOString().split('T')[0]).sort();
    expect(resultDates).toEqual(['2024-01-15', '2024-01-16', '2024-01-17']);

    // Should NOT include dates outside the range
    const excludedScores = [10, 50]; // Scores from excluded dates
    results.forEach(result => {
      expect(excludedScores).not.toContain(result.total_conspiracy_score);
    });
  });
});
