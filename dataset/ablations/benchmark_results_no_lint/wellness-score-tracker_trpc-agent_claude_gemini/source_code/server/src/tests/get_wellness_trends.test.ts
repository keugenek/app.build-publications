import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';

// Helper function to calculate wellness score (simple implementation for testing)
const calculateWellnessScore = (sleepHours: number, stressLevel: number, caffeineIntake: number, alcoholIntake: number): number => {
  // Simple scoring algorithm for testing purposes
  const sleepScore = Math.min(sleepHours / 8, 1) * 25; // Max 25 points for 8+ hours of sleep
  const stressScore = (11 - stressLevel) * 2.5; // Max 25 points for stress level 1
  const caffeineScore = Math.max(25 - (caffeineIntake / 20), 0); // Max 25 points for no caffeine
  const alcoholScore = Math.max(25 - (alcoholIntake * 5), 0); // Max 25 points for no alcohol
  
  return Math.round((sleepScore + stressScore + caffeineScore + alcoholScore) * 100) / 100;
};

// Helper function to create test wellness entries
const createTestEntry = async (userData: {
  user_id: string;
  date: string;
  sleep_hours: number;
  stress_level: number;
  caffeine_intake: number;
  alcohol_intake: number;
}) => {
  const wellnessScore = calculateWellnessScore(
    userData.sleep_hours,
    userData.stress_level,
    userData.caffeine_intake,
    userData.alcohol_intake
  );

  await db.insert(wellnessEntriesTable)
    .values({
      user_id: userData.user_id,
      date: userData.date,
      sleep_hours: userData.sleep_hours.toString(),
      stress_level: userData.stress_level,
      caffeine_intake: userData.caffeine_intake,
      alcohol_intake: userData.alcohol_intake,
      wellness_score: wellnessScore.toString()
    })
    .execute();
};

describe('getWellnessTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUserId = 'test-user-123';
  const otherUserId = 'other-user-456';

  it('should return empty trends for user with no entries', async () => {
    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toEqual([]);
    expect(result.averages).toEqual({
      wellness_score: 0,
      sleep_hours: 0,
      stress_level: 0,
      caffeine_intake: 0,
      alcohol_intake: 0
    });
    expect(result.summary.total_entries).toBe(0);
    expect(result.summary.date_range.start).toBe('');
    expect(result.summary.date_range.end).toBe('');
  });

  it('should fetch wellness trends for a user', async () => {
    // Create test entries
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 3,
      caffeine_intake: 100,
      alcohol_intake: 1
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-02',
      sleep_hours: 7.5,
      stress_level: 5,
      caffeine_intake: 150,
      alcohol_intake: 0
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toHaveLength(2);
    expect(result.summary.total_entries).toBe(2);

    // Check that trends are in chronological order (earliest first)
    expect(result.trends[0].date).toBe('2024-01-01');
    expect(result.trends[1].date).toBe('2024-01-02');

    // Verify numeric conversions work correctly
    expect(typeof result.trends[0].wellness_score).toBe('number');
    expect(typeof result.trends[0].sleep_hours).toBe('number');
    expect(result.trends[0].sleep_hours).toBe(8.0);
    expect(result.trends[1].sleep_hours).toBe(7.5);

    // Check averages calculation
    expect(result.averages.sleep_hours).toBe(7.75); // (8.0 + 7.5) / 2
    expect(result.averages.stress_level).toBe(4); // (3 + 5) / 2
    expect(result.averages.caffeine_intake).toBe(125); // (100 + 150) / 2
    expect(result.averages.alcohol_intake).toBe(0.5); // (1 + 0) / 2

    // Check date range
    expect(result.summary.date_range.start).toBe('2024-01-01');
    expect(result.summary.date_range.end).toBe('2024-01-02');
  });

  it('should filter by date range correctly', async () => {
    // Create entries across multiple dates
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-15',
      sleep_hours: 7.0,
      stress_level: 4,
      caffeine_intake: 100,
      alcohol_intake: 1
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-02-01',
      sleep_hours: 6.5,
      stress_level: 6,
      caffeine_intake: 200,
      alcohol_intake: 2
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      start_date: '2024-01-10',
      end_date: '2024-01-31',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Should only return the entry from 2024-01-15
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0].date).toBe('2024-01-15');
    expect(result.summary.total_entries).toBe(1);
    expect(result.summary.date_range.start).toBe('2024-01-15');
    expect(result.summary.date_range.end).toBe('2024-01-15');
  });

  it('should filter by start date only', async () => {
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-15',
      sleep_hours: 7.0,
      stress_level: 4,
      caffeine_intake: 100,
      alcohol_intake: 1
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      start_date: '2024-01-10',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Should only return entries from 2024-01-10 onwards
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0].date).toBe('2024-01-15');
  });

  it('should filter by end date only', async () => {
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-15',
      sleep_hours: 7.0,
      stress_level: 4,
      caffeine_intake: 100,
      alcohol_intake: 1
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      end_date: '2024-01-10',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Should only return entries up to 2024-01-10
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0].date).toBe('2024-01-01');
  });

  it('should respect limit parameter', async () => {
    // Create multiple entries
    for (let i = 1; i <= 10; i++) {
      await createTestEntry({
        user_id: testUserId,
        date: `2024-01-${i.toString().padStart(2, '0')}`,
        sleep_hours: 7 + (i % 3),
        stress_level: 3 + (i % 5),
        caffeine_intake: 100 + (i * 10),
        alcohol_intake: i % 3
      });
    }

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      limit: 5
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toHaveLength(5);
    expect(result.summary.total_entries).toBe(5);
  });

  it('should only return entries for specified user', async () => {
    // Create entries for different users
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    });

    await createTestEntry({
      user_id: otherUserId,
      date: '2024-01-01',
      sleep_hours: 6.0,
      stress_level: 8,
      caffeine_intake: 300,
      alcohol_intake: 3
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toHaveLength(1);
    expect(result.trends[0].sleep_hours).toBe(8.0);
    expect(result.trends[0].stress_level).toBe(2);
  });

  it('should calculate averages correctly with decimal precision', async () => {
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.25,
      stress_level: 1,
      caffeine_intake: 75,
      alcohol_intake: 1
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-02',
      sleep_hours: 7.75,
      stress_level: 3,
      caffeine_intake: 125,
      alcohol_intake: 2
    });

    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-03',
      sleep_hours: 6.5,
      stress_level: 5,
      caffeine_intake: 200,
      alcohol_intake: 0
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toHaveLength(3);
    
    // Check precise average calculations
    expect(result.averages.sleep_hours).toBe(7.5); // (8.25 + 7.75 + 6.5) / 3 = 7.5
    expect(result.averages.stress_level).toBe(3); // (1 + 3 + 5) / 3 = 3
    expect(result.averages.caffeine_intake).toBe(133.33); // (75 + 125 + 200) / 3 = 133.33
    expect(result.averages.alcohol_intake).toBe(1); // (1 + 2 + 0) / 3 = 1
  });

  it('should handle date range with input dates but no matching entries', async () => {
    await createTestEntry({
      user_id: testUserId,
      date: '2024-01-01',
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    });

    const input: GetWellnessEntriesInput = {
      user_id: testUserId,
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result.trends).toHaveLength(0);
    expect(result.summary.total_entries).toBe(0);
    expect(result.summary.date_range.start).toBe('2024-02-01');
    expect(result.summary.date_range.end).toBe('2024-02-28');
  });
});
