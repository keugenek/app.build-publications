import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

// Helper function to create test wellness entries
const createTestEntries = async () => {
  const entries = [
    {
      user_id: 'user1',
      date: '2024-01-15',
      sleep_hours: '8.5',
      stress_level: 3,
      caffeine_intake: '150.0',
      alcohol_intake: '1.0',
      wellness_score: '85.5'
    },
    {
      user_id: 'user1',
      date: '2024-01-14',
      sleep_hours: '7.0',
      stress_level: 5,
      caffeine_intake: '200.0',
      alcohol_intake: '0.0',
      wellness_score: '70.0'
    },
    {
      user_id: 'user1',
      date: '2024-01-13',
      sleep_hours: '6.5',
      stress_level: 7,
      caffeine_intake: '300.0',
      alcohol_intake: '2.0',
      wellness_score: '55.0'
    },
    {
      user_id: 'user2',
      date: '2024-01-15',
      sleep_hours: '9.0',
      stress_level: 2,
      caffeine_intake: '100.0',
      alcohol_intake: '0.5',
      wellness_score: '90.0'
    }
  ];

  await db.insert(wellnessEntriesTable).values(entries).execute();
};

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch wellness entries for a user', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(3);
    expect(result[0].user_id).toEqual('user1');
    expect(result[1].user_id).toEqual('user1');
    expect(result[2].user_id).toEqual('user1');
  });

  it('should return entries ordered by date descending', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(3);
    // Should be ordered newest first (2024-01-15, 2024-01-14, 2024-01-13)
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[1].date).toEqual(new Date('2024-01-14'));
    expect(result[2].date).toEqual(new Date('2024-01-13'));
  });

  it('should convert numeric fields correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 30
    };

    const result = await getWellnessEntries(input);

    const firstEntry = result[0];
    expect(typeof firstEntry.sleep_hours).toBe('number');
    expect(typeof firstEntry.caffeine_intake).toBe('number');
    expect(typeof firstEntry.alcohol_intake).toBe('number');
    expect(typeof firstEntry.wellness_score).toBe('number');
    
    expect(firstEntry.sleep_hours).toEqual(8.5);
    expect(firstEntry.caffeine_intake).toEqual(150.0);
    expect(firstEntry.alcohol_intake).toEqual(1.0);
    expect(firstEntry.wellness_score).toEqual(85.5);
  });

  it('should filter entries only for the specified user', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user2',
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user2');
    expect(result[0].wellness_score).toEqual(90.0);
  });

  it('should respect the limit parameter', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 2
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    // Should get the 2 most recent entries
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[1].date).toEqual(new Date('2024-01-14'));
  });

  it('should filter by start_date when provided', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      start_date: new Date('2024-01-14'),
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[1].date).toEqual(new Date('2024-01-14'));
    // Should not include 2024-01-13 entry
  });

  it('should filter by end_date when provided', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      end_date: new Date('2024-01-14'),
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-14'));
    expect(result[1].date).toEqual(new Date('2024-01-13'));
    // Should not include 2024-01-15 entry
  });

  it('should filter by date range when both start_date and end_date are provided', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      start_date: new Date('2024-01-14'),
      end_date: new Date('2024-01-14'),
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-14'));
    expect(result[0].stress_level).toEqual(5);
  });

  it('should return empty array when no entries match filters', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'nonexistent_user',
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when date range has no matches', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      start_date: new Date('2024-01-20'),
      end_date: new Date('2024-01-25'),
      limit: 30
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should handle database timestamps correctly', async () => {
    await createTestEntries();

    const input: GetWellnessEntriesInput = {
      user_id: 'user1',
      limit: 1
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');
    expect(typeof result[0].stress_level).toBe('number');
  });
});
