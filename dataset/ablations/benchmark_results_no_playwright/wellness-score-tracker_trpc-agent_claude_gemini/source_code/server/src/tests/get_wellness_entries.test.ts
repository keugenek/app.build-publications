import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

// Helper function to create test wellness entries
const createTestEntry = async (data: {
  user_id: number;
  date: Date;
  hours_of_sleep: number;
  stress_level: number;
  caffeine_intake: number;
  alcohol_intake: number;
  wellness_score: number;
}) => {
  await db.insert(wellnessEntriesTable)
    .values({
      user_id: data.user_id,
      date: data.date.toISOString().split('T')[0],
      hours_of_sleep: data.hours_of_sleep,
      stress_level: data.stress_level,
      caffeine_intake: data.caffeine_intake,
      alcohol_intake: data.alcohol_intake,
      wellness_score: data.wellness_score
    })
    .execute();
};

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist for user', async () => {
    const input: GetWellnessEntriesInput = {
      user_id: 999
    };

    const result = await getWellnessEntries(input);
    expect(result).toEqual([]);
  });

  it('should retrieve wellness entries for a user', async () => {
    const testDate = new Date('2024-01-15');
    
    // Create test entry
    await createTestEntry({
      user_id: 1,
      date: testDate,
      hours_of_sleep: 7.5,
      stress_level: 6,
      caffeine_intake: 150.5,
      alcohol_intake: 2.0,
      wellness_score: 75.8
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(1);
    expect(result[0].date).toEqual(testDate);
    expect(result[0].hours_of_sleep).toBe(7.5);
    expect(result[0].stress_level).toBe(6);
    expect(result[0].caffeine_intake).toBe(150.5);
    expect(result[0].alcohol_intake).toBe(2.0);
    expect(result[0].wellness_score).toBe(75.8);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return entries ordered by date descending', async () => {
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-15');
    const date3 = new Date('2024-01-20');

    // Create entries in random order
    await createTestEntry({
      user_id: 1,
      date: date2,
      hours_of_sleep: 7,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 1,
      wellness_score: 70
    });

    await createTestEntry({
      user_id: 1,
      date: date1,
      hours_of_sleep: 8,
      stress_level: 4,
      caffeine_intake: 80,
      alcohol_intake: 0,
      wellness_score: 80
    });

    await createTestEntry({
      user_id: 1,
      date: date3,
      hours_of_sleep: 6.5,
      stress_level: 7,
      caffeine_intake: 200,
      alcohol_intake: 3,
      wellness_score: 60
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(3);
    // Should be ordered newest first (descending)
    expect(result[0].date).toEqual(date3);
    expect(result[1].date).toEqual(date2);
    expect(result[2].date).toEqual(date1);
  });

  it('should filter by date range when start_date provided', async () => {
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-15');
    const date3 = new Date('2024-01-20');

    // Create entries across multiple dates
    await createTestEntry({
      user_id: 1,
      date: date1,
      hours_of_sleep: 8,
      stress_level: 4,
      caffeine_intake: 80,
      alcohol_intake: 0,
      wellness_score: 80
    });

    await createTestEntry({
      user_id: 1,
      date: date2,
      hours_of_sleep: 7,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 1,
      wellness_score: 70
    });

    await createTestEntry({
      user_id: 1,
      date: date3,
      hours_of_sleep: 6.5,
      stress_level: 7,
      caffeine_intake: 200,
      alcohol_intake: 3,
      wellness_score: 60
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      start_date: new Date('2024-01-15')
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(date3);
    expect(result[1].date).toEqual(date2);
  });

  it('should filter by date range when end_date provided', async () => {
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-15');
    const date3 = new Date('2024-01-20');

    // Create entries across multiple dates
    await createTestEntry({
      user_id: 1,
      date: date1,
      hours_of_sleep: 8,
      stress_level: 4,
      caffeine_intake: 80,
      alcohol_intake: 0,
      wellness_score: 80
    });

    await createTestEntry({
      user_id: 1,
      date: date2,
      hours_of_sleep: 7,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 1,
      wellness_score: 70
    });

    await createTestEntry({
      user_id: 1,
      date: date3,
      hours_of_sleep: 6.5,
      stress_level: 7,
      caffeine_intake: 200,
      alcohol_intake: 3,
      wellness_score: 60
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      end_date: new Date('2024-01-15')
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(date2);
    expect(result[1].date).toEqual(date1);
  });

  it('should filter by date range when both start_date and end_date provided', async () => {
    const date1 = new Date('2024-01-05');
    const date2 = new Date('2024-01-10');
    const date3 = new Date('2024-01-15');
    const date4 = new Date('2024-01-20');

    // Create entries across multiple dates
    await createTestEntry({
      user_id: 1,
      date: date1,
      hours_of_sleep: 8,
      stress_level: 3,
      caffeine_intake: 50,
      alcohol_intake: 0,
      wellness_score: 85
    });

    await createTestEntry({
      user_id: 1,
      date: date2,
      hours_of_sleep: 7.5,
      stress_level: 4,
      caffeine_intake: 80,
      alcohol_intake: 1,
      wellness_score: 75
    });

    await createTestEntry({
      user_id: 1,
      date: date3,
      hours_of_sleep: 7,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 1,
      wellness_score: 70
    });

    await createTestEntry({
      user_id: 1,
      date: date4,
      hours_of_sleep: 6.5,
      stress_level: 7,
      caffeine_intake: 200,
      alcohol_intake: 3,
      wellness_score: 60
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-15')
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(date3);
    expect(result[1].date).toEqual(date2);
  });

  it('should respect limit parameter', async () => {
    // Create 5 entries for the same user
    for (let i = 1; i <= 5; i++) {
      await createTestEntry({
        user_id: 1,
        date: new Date(`2024-01-${i.toString().padStart(2, '0')}`),
        hours_of_sleep: 8,
        stress_level: 5,
        caffeine_intake: 100,
        alcohol_intake: 1,
        wellness_score: 70
      });
    }

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      limit: 3
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(3);
  });

  it('should apply default limit of 30 when not specified', async () => {
    // Create 35 entries to test default limit (across multiple months to avoid invalid dates)
    for (let i = 1; i <= 35; i++) {
      const month = Math.floor((i - 1) / 28) + 1;
      const day = ((i - 1) % 28) + 1;
      await createTestEntry({
        user_id: 1,
        date: new Date(`2024-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
        hours_of_sleep: 8,
        stress_level: 5,
        caffeine_intake: 100,
        alcohol_intake: 1,
        wellness_score: 70
      });
    }

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(30); // Should be limited to default 30
  });

  it('should only return entries for the specified user', async () => {
    const testDate = new Date('2024-01-15');
    
    // Create entries for different users
    await createTestEntry({
      user_id: 1,
      date: testDate,
      hours_of_sleep: 7,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 1,
      wellness_score: 70
    });

    await createTestEntry({
      user_id: 2,
      date: testDate,
      hours_of_sleep: 8,
      stress_level: 3,
      caffeine_intake: 50,
      alcohol_intake: 0,
      wellness_score: 85
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(1);
    expect(result[0].wellness_score).toBe(70);
  });

  it('should handle numeric field conversions correctly', async () => {
    const testDate = new Date('2024-01-15');
    
    await createTestEntry({
      user_id: 1,
      date: testDate,
      hours_of_sleep: 7.25,
      stress_level: 6,
      caffeine_intake: 125.75,
      alcohol_intake: 1.5,
      wellness_score: 73.2
    });

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(typeof result[0].hours_of_sleep).toBe('number');
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(typeof result[0].alcohol_intake).toBe('number');
    expect(typeof result[0].wellness_score).toBe('number');
    expect(result[0].hours_of_sleep).toBe(7.25);
    expect(result[0].caffeine_intake).toBe(125.75);
    expect(result[0].alcohol_intake).toBe(1.5);
    expect(result[0].wellness_score).toBe(73.2);
  });
});
