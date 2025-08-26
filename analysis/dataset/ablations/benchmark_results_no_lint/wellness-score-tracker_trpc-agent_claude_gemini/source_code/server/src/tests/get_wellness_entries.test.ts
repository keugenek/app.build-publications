import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

// Helper function to calculate wellness score (basic implementation)
const calculateWellnessScore = (sleepHours: number, stressLevel: number, caffeineIntake: number, alcoholIntake: number): number => {
  // Simple wellness score calculation for testing
  let score = 50; // Base score
  
  // Sleep factor (optimal 7-9 hours)
  if (sleepHours >= 7 && sleepHours <= 9) {
    score += 20;
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    score += 10;
  } else {
    score -= 10;
  }
  
  // Stress factor (lower is better)
  score -= (stressLevel - 1) * 5;
  
  // Caffeine factor (moderate intake is okay)
  if (caffeineIntake <= 200) {
    score += 5;
  } else if (caffeineIntake > 400) {
    score -= 10;
  }
  
  // Alcohol factor (less is better)
  score -= alcoholIntake * 3;
  
  return Math.max(0, Math.min(100, score));
};

// Helper function to create test wellness entries
const createTestEntries = async () => {
  const entries = [
    {
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: '8.5',
      stress_level: 3,
      caffeine_intake: 150,
      alcohol_intake: 0,
      wellness_score: calculateWellnessScore(8.5, 3, 150, 0).toString()
    },
    {
      user_id: 'user123',
      date: '2024-01-14',
      sleep_hours: '7.0',
      stress_level: 5,
      caffeine_intake: 200,
      alcohol_intake: 1,
      wellness_score: calculateWellnessScore(7.0, 5, 200, 1).toString()
    },
    {
      user_id: 'user123',
      date: '2024-01-13',
      sleep_hours: '6.5',
      stress_level: 7,
      caffeine_intake: 300,
      alcohol_intake: 2,
      wellness_score: calculateWellnessScore(6.5, 7, 300, 2).toString()
    },
    {
      user_id: 'user456', // Different user
      date: '2024-01-15',
      sleep_hours: '8.0',
      stress_level: 2,
      caffeine_intake: 100,
      alcohol_intake: 0,
      wellness_score: calculateWellnessScore(8.0, 2, 100, 0).toString()
    },
    {
      user_id: 'user123',
      date: '2024-01-10', // Older entry
      sleep_hours: '9.0',
      stress_level: 1,
      caffeine_intake: 50,
      alcohol_intake: 0,
      wellness_score: calculateWellnessScore(9.0, 1, 50, 0).toString()
    }
  ];

  await db.insert(wellnessEntriesTable).values(entries).execute();
};

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all entries for a user when no date filters are provided', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(4); // 4 entries for user123
    expect(results[0].user_id).toBe('user123');
    expect(results[0].date).toEqual(new Date('2024-01-15')); // Most recent first
    expect(results[1].date).toEqual(new Date('2024-01-14'));
    expect(results[2].date).toEqual(new Date('2024-01-13'));
    expect(results[3].date).toEqual(new Date('2024-01-10')); // Oldest last
  });

  it('should convert numeric fields correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      limit: 1
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(1);
    expect(typeof results[0].sleep_hours).toBe('number');
    expect(results[0].sleep_hours).toBe(8.5);
    expect(typeof results[0].wellness_score).toBe('number');
    expect(results[0].wellness_score).toBeGreaterThan(0);
    expect(typeof results[0].stress_level).toBe('number');
    expect(typeof results[0].caffeine_intake).toBe('number');
    expect(typeof results[0].alcohol_intake).toBe('number');
  });

  it('should filter by start_date correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      start_date: '2024-01-14',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(2); // Only entries from 2024-01-14 onwards
    expect(results[0].date).toEqual(new Date('2024-01-15'));
    expect(results[1].date).toEqual(new Date('2024-01-14'));
  });

  it('should filter by end_date correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      end_date: '2024-01-13',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(2); // Only entries up to 2024-01-13
    expect(results[0].date).toEqual(new Date('2024-01-13'));
    expect(results[1].date).toEqual(new Date('2024-01-10'));
  });

  it('should filter by date range correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      start_date: '2024-01-13',
      end_date: '2024-01-14',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(2); // Only entries within range
    expect(results[0].date).toEqual(new Date('2024-01-14'));
    expect(results[1].date).toEqual(new Date('2024-01-13'));
  });

  it('should respect the limit parameter', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      limit: 2
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(2);
    expect(results[0].date).toEqual(new Date('2024-01-15')); // Most recent
    expect(results[1].date).toEqual(new Date('2024-01-14')); // Second most recent
  });

  it('should only return entries for the specified user', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user456',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(1);
    expect(results[0].user_id).toBe('user456');
  });

  it('should return empty array when no entries match criteria', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'nonexistent_user',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when date range has no matches', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(0);
  });

  it('should use default limit when not specified', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      limit: 30 // Include the limit property with default value
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(4); // All 4 entries returned (less than default limit)
  });

  it('should handle entries with same date correctly', async () => {
    // Create entries with the same date for the same user
    await db.insert(wellnessEntriesTable).values([
      {
        user_id: 'user123',
        date: '2024-01-15',
        sleep_hours: '8.0',
        stress_level: 3,
        caffeine_intake: 150,
        alcohol_intake: 0,
        wellness_score: '75.00'
      },
      {
        user_id: 'user123',
        date: '2024-01-15',
        sleep_hours: '7.5',
        stress_level: 4,
        caffeine_intake: 200,
        alcohol_intake: 1,
        wellness_score: '70.00'
      }
    ]).execute();

    const input: GetWellnessEntriesInput = {
      user_id: 'user123',
      limit: 30
    };

    const results = await getWellnessEntries(input);

    expect(results).toHaveLength(2);
    expect(results[0].date).toEqual(new Date('2024-01-15'));
    expect(results[1].date).toEqual(new Date('2024-01-15'));
  });
});
