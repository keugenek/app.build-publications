import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type CreateWellnessEntryInput } from '../schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';

// Helper function to create wellness entries for testing
const createWellnessEntry = async (input: CreateWellnessEntryInput & { wellness_score: number }) => {
  const result = await db.insert(wellnessEntriesTable)
    .values({
      user_id: input.user_id,
      date: input.date.toISOString().split('T')[0],
      sleep_hours: input.sleep_hours.toString(),
      stress_level: input.stress_level,
      caffeine_intake: input.caffeine_intake.toString(),
      alcohol_intake: input.alcohol_intake.toString(),
      wellness_score: input.wellness_score.toString()
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('getWellnessTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return wellness trends for a user', async () => {
    // Create test data
    const userId = 'user123';
    const testEntries = [
      {
        user_id: userId,
        date: new Date('2024-01-01'),
        sleep_hours: 7.5,
        stress_level: 4,
        caffeine_intake: 120,
        alcohol_intake: 0,
        wellness_score: 82
      },
      {
        user_id: userId,
        date: new Date('2024-01-02'),
        sleep_hours: 8,
        stress_level: 5,
        caffeine_intake: 150,
        alcohol_intake: 1,
        wellness_score: 75
      }
    ];

    // Insert test data
    for (const entry of testEntries) {
      await createWellnessEntry(entry);
    }

    // Test the handler
    const input: GetWellnessEntriesInput = {
      user_id: userId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first entry (should be ordered by date ascending)
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[0].sleep_hours).toEqual(7.5);
    expect(result[0].stress_level).toEqual(4);
    expect(result[0].caffeine_intake).toEqual(120);
    expect(result[0].alcohol_intake).toEqual(0);
    expect(result[0].wellness_score).toEqual(82);
    
    // Check second entry
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[1].sleep_hours).toEqual(8);
    expect(result[1].stress_level).toEqual(5);
    expect(result[1].caffeine_intake).toEqual(150);
    expect(result[1].alcohol_intake).toEqual(1);
    expect(result[1].wellness_score).toEqual(75);
  });

  it('should return empty array for user with no entries', async () => {
    const input: GetWellnessEntriesInput = {
      user_id: 'nonexistent_user',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result).toHaveLength(0);
  });

  it('should filter entries by date range', async () => {
    const userId = 'user456';
    
    // Create entries spanning multiple dates
    const testEntries = [
      {
        user_id: userId,
        date: new Date('2024-01-01'),
        sleep_hours: 7,
        stress_level: 3,
        caffeine_intake: 100,
        alcohol_intake: 0,
        wellness_score: 85
      },
      {
        user_id: userId,
        date: new Date('2024-01-15'),
        sleep_hours: 8,
        stress_level: 4,
        caffeine_intake: 120,
        alcohol_intake: 1,
        wellness_score: 80
      },
      {
        user_id: userId,
        date: new Date('2024-02-01'),
        sleep_hours: 6,
        stress_level: 6,
        caffeine_intake: 200,
        alcohol_intake: 2,
        wellness_score: 65
      }
    ];

    for (const entry of testEntries) {
      await createWellnessEntry(entry);
    }

    // Test with date range filter
    const input: GetWellnessEntriesInput = {
      user_id: userId,
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-20'),
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Should only return the middle entry
    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[0].sleep_hours).toEqual(8);
    expect(result[0].wellness_score).toEqual(80);
  });

  it('should respect limit parameter', async () => {
    const userId = 'user789';
    
    // Create 5 entries
    for (let i = 1; i <= 5; i++) {
      await createWellnessEntry({
        user_id: userId,
        date: new Date(`2024-01-${i.toString().padStart(2, '0')}`),
        sleep_hours: 7 + i * 0.5,
        stress_level: i,
        caffeine_intake: 100 + i * 10,
        alcohol_intake: i * 0.5,
        wellness_score: 90 - i * 2
      });
    }

    // Test with limit of 3
    const input: GetWellnessEntriesInput = {
      user_id: userId,
      limit: 3
    };

    const result = await getWellnessTrends(input);

    // Should return only 3 entries
    expect(result).toHaveLength(3);
    
    // Should be ordered by date ascending
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[2].date).toEqual(new Date('2024-01-03'));
  });

  it('should only return entries for specified user', async () => {
    // Create entries for multiple users
    await createWellnessEntry({
      user_id: 'user1',
      date: new Date('2024-01-01'),
      sleep_hours: 7,
      stress_level: 3,
      caffeine_intake: 100,
      alcohol_intake: 0,
      wellness_score: 85
    });

    await createWellnessEntry({
      user_id: 'user2',
      date: new Date('2024-01-01'),
      sleep_hours: 8,
      stress_level: 4,
      caffeine_intake: 150,
      alcohol_intake: 1,
      wellness_score: 80
    });

    // Query for user1 only
    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 30
    };

    const result = await getWellnessTrends(input);

    // Should only return entry for user1
    expect(result).toHaveLength(1);
    expect(result[0].sleep_hours).toEqual(7);
    expect(result[0].stress_level).toEqual(3);
  });

  it('should handle numeric conversions correctly', async () => {
    const userId = 'user_numeric';
    
    await createWellnessEntry({
      user_id: userId,
      date: new Date('2024-01-01'),
      sleep_hours: 7.75, // Decimal value
      stress_level: 5,
      caffeine_intake: 125.5, // Decimal value
      alcohol_intake: 1.5, // Decimal value
      wellness_score: 82.25 // Decimal value
    });

    const input: GetWellnessEntriesInput = {
      user_id: userId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result).toHaveLength(1);
    
    // Verify all numeric fields are properly converted
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(result[0].sleep_hours).toEqual(7.75);
    
    expect(typeof result[0].stress_level).toBe('number');
    expect(result[0].stress_level).toEqual(5);
    
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(result[0].caffeine_intake).toEqual(125.5);
    
    expect(typeof result[0].alcohol_intake).toBe('number');
    expect(result[0].alcohol_intake).toEqual(1.5);
    
    expect(typeof result[0].wellness_score).toBe('number');
    expect(result[0].wellness_score).toEqual(82.25);
  });

  it('should return entries ordered by date ascending', async () => {
    const userId = 'user_ordering';
    
    // Create entries in non-chronological order
    const dates = ['2024-01-15', '2024-01-01', '2024-01-10', '2024-01-05'];
    
    for (let i = 0; i < dates.length; i++) {
      await createWellnessEntry({
        user_id: userId,
        date: new Date(dates[i]),
        sleep_hours: 7 + i,
        stress_level: 3 + i,
        caffeine_intake: 100 + i * 10,
        alcohol_intake: i * 0.5,
        wellness_score: 85 - i * 2
      });
    }

    const input: GetWellnessEntriesInput = {
      user_id: userId,
      limit: 30
    };

    const result = await getWellnessTrends(input);

    expect(result).toHaveLength(4);
    
    // Verify chronological order (ascending)
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[1].date).toEqual(new Date('2024-01-05'));
    expect(result[2].date).toEqual(new Date('2024-01-10'));
    expect(result[3].date).toEqual(new Date('2024-01-15'));
  });
});
