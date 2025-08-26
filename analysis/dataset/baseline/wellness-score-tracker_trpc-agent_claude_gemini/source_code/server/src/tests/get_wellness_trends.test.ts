import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';

// Utility function to calculate wellness score (mock calculation)
const calculateWellnessScore = (sleepHours: number, stressLevel: number, caffeineIntake: number, alcoholIntake: number): number => {
  // Simple wellness score calculation for testing
  const sleepScore = Math.min(sleepHours * 12.5, 100); // 8 hours = 100 points
  const stressScore = 100 - (stressLevel - 1) * 11.11; // stress 1 = 100, stress 10 = 0
  const caffeineScore = Math.max(100 - (caffeineIntake / 400) * 100, 0); // 400mg = 0 points
  const alcoholScore = Math.max(100 - alcoholIntake * 20, 0); // Each unit = -20 points
  
  return Math.round((sleepScore + stressScore + caffeineScore + alcoholScore) / 4 * 100) / 100;
};

// Test data setup
const createTestEntries = async () => {
  const testEntries = [
    {
      sleep_hours: '8.0',
      stress_level: 2,
      caffeine_intake: '100.0',
      alcohol_intake: '0.0',
      wellness_score: calculateWellnessScore(8.0, 2, 100.0, 0.0).toString(),
      entry_date: '2024-01-01'
    },
    {
      sleep_hours: '7.5',
      stress_level: 3,
      caffeine_intake: '150.0',
      alcohol_intake: '1.0',
      wellness_score: calculateWellnessScore(7.5, 3, 150.0, 1.0).toString(),
      entry_date: '2024-01-02'
    },
    {
      sleep_hours: '6.5',
      stress_level: 5,
      caffeine_intake: '200.0',
      alcohol_intake: '2.0',
      wellness_score: calculateWellnessScore(6.5, 5, 200.0, 2.0).toString(),
      entry_date: '2024-01-03'
    },
    {
      sleep_hours: '9.0',
      stress_level: 1,
      caffeine_intake: '50.0',
      alcohol_intake: '0.5',
      wellness_score: calculateWellnessScore(9.0, 1, 50.0, 0.5).toString(),
      entry_date: '2024-01-05' // Gap in dates
    }
  ];

  for (const entry of testEntries) {
    await db.insert(wellnessEntriesTable)
      .values(entry)
      .execute();
  }
};

describe('getWellnessTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty trends when no entries exist', async () => {
    const result = await getWellnessTrends();

    expect(result.entries).toHaveLength(0);
    expect(result.average_wellness_score).toEqual(0);
    expect(result.average_sleep_hours).toEqual(0);
    expect(result.average_stress_level).toEqual(0);
    expect(result.average_caffeine_intake).toEqual(0);
    expect(result.average_alcohol_intake).toEqual(0);
    expect(result.total_entries).toEqual(0);
  });

  it('should return all entries with correct averages when no filters applied', async () => {
    await createTestEntries();
    
    const result = await getWellnessTrends();

    expect(result.entries).toHaveLength(4);
    expect(result.total_entries).toEqual(4);

    // Verify entries are ordered by entry_date ascending
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-01');
    expect(result.entries[1].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');
    expect(result.entries[2].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-03');
    expect(result.entries[3].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-05');

    // Verify numeric field conversions
    expect(typeof result.entries[0].sleep_hours).toBe('number');
    expect(typeof result.entries[0].caffeine_intake).toBe('number');
    expect(typeof result.entries[0].alcohol_intake).toBe('number');
    expect(typeof result.entries[0].wellness_score).toBe('number');

    // Calculate expected averages manually (with rounding to match handler)
    const expectedSleepAvg = Math.round(((8.0 + 7.5 + 6.5 + 9.0) / 4) * 100) / 100;
    const expectedStressAvg = Math.round(((2 + 3 + 5 + 1) / 4) * 100) / 100;
    const expectedCaffeineAvg = Math.round(((100 + 150 + 200 + 50) / 4) * 100) / 100;
    const expectedAlcoholAvg = Math.round(((0 + 1 + 2 + 0.5) / 4) * 100) / 100;

    expect(result.average_sleep_hours).toEqual(expectedSleepAvg);
    expect(result.average_stress_level).toEqual(expectedStressAvg);
    expect(result.average_caffeine_intake).toEqual(expectedCaffeineAvg);
    expect(result.average_alcohol_intake).toEqual(expectedAlcoholAvg);
    expect(result.average_wellness_score).toBeGreaterThan(0);
  });

  it('should filter entries by start_date', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02'
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(3);
    expect(result.total_entries).toEqual(3);
    
    // Should not include the 2024-01-01 entry
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');
    expect(result.entries[1].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-03');
    expect(result.entries[2].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-05');

    // Averages should be calculated from 3 entries only
    const expectedSleepAvg = (7.5 + 6.5 + 9.0) / 3;
    expect(result.average_sleep_hours).toEqual(Math.round(expectedSleepAvg * 100) / 100);
  });

  it('should filter entries by end_date', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      end_date: '2024-01-03'
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(3);
    expect(result.total_entries).toEqual(3);
    
    // Should not include the 2024-01-05 entry
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-01');
    expect(result.entries[1].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');
    expect(result.entries[2].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-03');
  });

  it('should filter entries by date range', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02',
      end_date: '2024-01-03'
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(2);
    expect(result.total_entries).toEqual(2);
    
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');
    expect(result.entries[1].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-03');

    // Verify averages calculated from 2 entries
    const expectedSleepAvg = (7.5 + 6.5) / 2;
    const expectedStressAvg = (3 + 5) / 2;
    
    expect(result.average_sleep_hours).toEqual(expectedSleepAvg);
    expect(result.average_stress_level).toEqual(expectedStressAvg);
  });

  it('should apply limit to results', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      limit: 2
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(2);
    expect(result.total_entries).toEqual(2);
    
    // Should get first 2 entries (ordered by date)
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-01');
    expect(result.entries[1].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');

    // Averages should be calculated from limited entries only
    const expectedSleepAvg = (8.0 + 7.5) / 2;
    expect(result.average_sleep_hours).toEqual(expectedSleepAvg);
  });

  it('should combine date range and limit filters', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02',
      limit: 1
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(1);
    expect(result.total_entries).toEqual(1);
    
    // Should get only the first entry from 2024-01-02 onwards
    expect(result.entries[0].entry_date.toISOString().substring(0, 10)).toEqual('2024-01-02');
    
    // Averages should be from single entry
    expect(result.average_sleep_hours).toEqual(7.5);
    expect(result.average_stress_level).toEqual(3);
    expect(result.average_caffeine_intake).toEqual(150);
    expect(result.average_alcohol_intake).toEqual(1);
  });

  it('should handle date range with no matching entries', async () => {
    await createTestEntries();
    
    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-10',
      end_date: '2024-01-20'
    };
    
    const result = await getWellnessTrends(input);

    expect(result.entries).toHaveLength(0);
    expect(result.total_entries).toEqual(0);
    expect(result.average_wellness_score).toEqual(0);
    expect(result.average_sleep_hours).toEqual(0);
    expect(result.average_stress_level).toEqual(0);
    expect(result.average_caffeine_intake).toEqual(0);
    expect(result.average_alcohol_intake).toEqual(0);
  });

  it('should round averages to 2 decimal places', async () => {
    // Create entries that will produce non-round averages
    await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: '7.33',
        stress_level: 3,
        caffeine_intake: '166.67',
        alcohol_intake: '0.33',
        wellness_score: '83.33',
        entry_date: '2024-01-01'
      })
      .execute();

    await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: '8.67',
        stress_level: 4,
        caffeine_intake: '233.33',
        alcohol_intake: '1.67',
        wellness_score: '76.67',
        entry_date: '2024-01-02'
      })
      .execute();

    const result = await getWellnessTrends();

    expect(result.entries).toHaveLength(2);
    
    // Verify rounding to 2 decimal places
    const expectedSleepAvg = Math.round(((7.33 + 8.67) / 2) * 100) / 100;
    const expectedCaffeineAvg = Math.round(((166.67 + 233.33) / 2) * 100) / 100;
    
    expect(result.average_sleep_hours).toEqual(expectedSleepAvg);
    expect(result.average_caffeine_intake).toEqual(expectedCaffeineAvg);
  });
});
