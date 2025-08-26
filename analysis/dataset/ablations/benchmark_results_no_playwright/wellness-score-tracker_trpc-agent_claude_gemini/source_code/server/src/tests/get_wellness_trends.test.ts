import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';

// Test wellness entries data
const testWellnessEntries = [
  {
    user_id: 1,
    date: '2024-01-01',
    hours_of_sleep: 7.5,
    stress_level: 3,
    caffeine_intake: 150.0,
    alcohol_intake: 1.5,
    wellness_score: 75.5
  },
  {
    user_id: 1,
    date: '2024-01-02',
    hours_of_sleep: 8.0,
    stress_level: 2,
    caffeine_intake: 100.0,
    alcohol_intake: 0.0,
    wellness_score: 85.0
  },
  {
    user_id: 1,
    date: '2024-01-03',
    hours_of_sleep: 6.5,
    stress_level: 7,
    caffeine_intake: 300.0,
    alcohol_intake: 2.0,
    wellness_score: 45.5
  },
  {
    user_id: 2, // Different user
    date: '2024-01-01',
    hours_of_sleep: 8.0,
    stress_level: 4,
    caffeine_intake: 200.0,
    alcohol_intake: 1.0,
    wellness_score: 70.0
  }
];

describe('getWellnessTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve wellness trends for a user', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessTrends(input);

    // Should return 3 entries for user 1
    expect(result).toHaveLength(3);

    // Verify data structure and numeric conversions
    expect(result[0].date).toBeInstanceOf(Date);
    expect(typeof result[0].wellness_score).toBe('number');
    expect(typeof result[0].hours_of_sleep).toBe('number');
    expect(typeof result[0].stress_level).toBe('number');
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(typeof result[0].alcohol_intake).toBe('number');

    // Verify first entry data
    expect(result[0].hours_of_sleep).toBe(7.5);
    expect(result[0].stress_level).toBe(3);
    expect(result[0].caffeine_intake).toBe(150.0);
    expect(result[0].alcohol_intake).toBe(1.5);
    expect(result[0].wellness_score).toBe(75.5);
  });

  it('should order results by date ascending', async () => {
    // Insert test data in random order
    const shuffledEntries = [
      testWellnessEntries[2], // 2024-01-03
      testWellnessEntries[0], // 2024-01-01  
      testWellnessEntries[1]  // 2024-01-02
    ];

    await db.insert(wellnessEntriesTable)
      .values(shuffledEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1
    };

    const result = await getWellnessTrends(input);

    // Should be ordered by date ascending
    expect(result).toHaveLength(3);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-01');
    expect(result[1].date.toISOString().split('T')[0]).toBe('2024-01-02');
    expect(result[2].date.toISOString().split('T')[0]).toBe('2024-01-03');
  });

  it('should filter by date range', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      start_date: new Date('2024-01-02'),
      end_date: new Date('2024-01-02')
    };

    const result = await getWellnessTrends(input);

    // Should return only the entry for 2024-01-02
    expect(result).toHaveLength(1);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-02');
    expect(result[0].wellness_score).toBe(85.0);
  });

  it('should filter by start_date only', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      start_date: new Date('2024-01-02')
    };

    const result = await getWellnessTrends(input);

    // Should return entries from 2024-01-02 onwards (2 entries)
    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-02');
    expect(result[1].date.toISOString().split('T')[0]).toBe('2024-01-03');
  });

  it('should filter by end_date only', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      end_date: new Date('2024-01-02')
    };

    const result = await getWellnessTrends(input);

    // Should return entries up to 2024-01-02 (2 entries)
    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-01');
    expect(result[1].date.toISOString().split('T')[0]).toBe('2024-01-02');
  });

  it('should respect limit parameter', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      limit: 2
    };

    const result = await getWellnessTrends(input);

    // Should return only 2 entries (first 2 chronologically)
    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-01');
    expect(result[1].date.toISOString().split('T')[0]).toBe('2024-01-02');
  });

  it('should filter by user_id correctly', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 2
    };

    const result = await getWellnessTrends(input);

    // Should return only 1 entry for user 2
    expect(result).toHaveLength(1);
    expect(result[0].wellness_score).toBe(70.0);
    expect(result[0].hours_of_sleep).toBe(8.0);
    expect(result[0].stress_level).toBe(4);
  });

  it('should return empty array for non-existent user', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 999 // Non-existent user
    };

    const result = await getWellnessTrends(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for date range with no data', async () => {
    // Insert test data
    await db.insert(wellnessEntriesTable)
      .values(testWellnessEntries)
      .execute();

    const input: GetWellnessEntriesInput = {
      user_id: 1,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getWellnessTrends(input);

    expect(result).toHaveLength(0);
  });
});
