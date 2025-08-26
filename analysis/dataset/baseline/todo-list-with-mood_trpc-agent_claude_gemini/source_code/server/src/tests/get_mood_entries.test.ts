import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DateRangeInput, type CreateMoodEntryInput } from '../schema';
import { getMoodEntries } from '../handlers/get_mood_entries';

// Test data setup
const createTestMoodEntry = async (entry: CreateMoodEntryInput & { date: string }) => {
  const result = await db.insert(moodEntriesTable)
    .values({
      mood_rating: entry.mood_rating,
      note: entry.note,
      date: entry.date,
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('getMoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all mood entries when no date range is provided', async () => {
    // Create test mood entries
    await createTestMoodEntry({
      mood_rating: 5,
      note: 'Great day!',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 3,
      note: 'Okay day',
      date: '2024-01-16',
    });

    await createTestMoodEntry({
      mood_rating: 4,
      note: null,
      date: '2024-01-17',
    });

    const result = await getMoodEntries();

    expect(result).toHaveLength(3);
    
    // Verify entries are ordered by date (newest first)
    expect(result[0].date).toEqual(new Date('2024-01-17'));
    expect(result[1].date).toEqual(new Date('2024-01-16'));
    expect(result[2].date).toEqual(new Date('2024-01-15'));

    // Verify all fields are properly returned
    expect(result[0].mood_rating).toEqual(4);
    expect(result[0].note).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].mood_rating).toEqual(3);
    expect(result[1].note).toEqual('Okay day');

    expect(result[2].mood_rating).toEqual(5);
    expect(result[2].note).toEqual('Great day!');
  });

  it('should filter by start_date when provided', async () => {
    // Create test mood entries across multiple dates
    await createTestMoodEntry({
      mood_rating: 5,
      note: 'Before range',
      date: '2024-01-10',
    });

    await createTestMoodEntry({
      mood_rating: 3,
      note: 'In range 1',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 4,
      note: 'In range 2',
      date: '2024-01-20',
    });

    const dateRange: DateRangeInput = {
      start_date: '2024-01-15',
    };

    const result = await getMoodEntries(dateRange);

    expect(result).toHaveLength(2);
    expect(result[0].note).toEqual('In range 2');
    expect(result[1].note).toEqual('In range 1');
    
    // Verify dates are >= start_date
    result.forEach(entry => {
      expect(entry.date >= new Date('2024-01-15')).toBe(true);
    });
  });

  it('should filter by end_date when provided', async () => {
    // Create test mood entries across multiple dates
    await createTestMoodEntry({
      mood_rating: 5,
      note: 'In range 1',
      date: '2024-01-10',
    });

    await createTestMoodEntry({
      mood_rating: 3,
      note: 'In range 2',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 4,
      note: 'After range',
      date: '2024-01-20',
    });

    const dateRange: DateRangeInput = {
      end_date: '2024-01-15',
    };

    const result = await getMoodEntries(dateRange);

    expect(result).toHaveLength(2);
    expect(result[0].note).toEqual('In range 2');
    expect(result[1].note).toEqual('In range 1');
    
    // Verify dates are <= end_date
    result.forEach(entry => {
      expect(entry.date <= new Date('2024-01-15')).toBe(true);
    });
  });

  it('should filter by both start_date and end_date when provided', async () => {
    // Create test mood entries across multiple dates
    await createTestMoodEntry({
      mood_rating: 1,
      note: 'Before range',
      date: '2024-01-10',
    });

    await createTestMoodEntry({
      mood_rating: 2,
      note: 'In range 1',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 3,
      note: 'In range 2',
      date: '2024-01-18',
    });

    await createTestMoodEntry({
      mood_rating: 4,
      note: 'In range 3',
      date: '2024-01-20',
    });

    await createTestMoodEntry({
      mood_rating: 5,
      note: 'After range',
      date: '2024-01-25',
    });

    const dateRange: DateRangeInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-20',
    };

    const result = await getMoodEntries(dateRange);

    expect(result).toHaveLength(3);
    expect(result[0].note).toEqual('In range 3');
    expect(result[1].note).toEqual('In range 2');
    expect(result[2].note).toEqual('In range 1');
    
    // Verify all dates are within the range
    result.forEach(entry => {
      expect(entry.date >= new Date('2024-01-15')).toBe(true);
      expect(entry.date <= new Date('2024-01-20')).toBe(true);
    });
  });

  it('should return empty array when no entries exist', async () => {
    const result = await getMoodEntries();
    expect(result).toHaveLength(0);
  });

  it('should return empty array when no entries match date range', async () => {
    // Create entries outside the range
    await createTestMoodEntry({
      mood_rating: 5,
      note: 'Outside range',
      date: '2024-01-10',
    });

    const dateRange: DateRangeInput = {
      start_date: '2024-01-20',
      end_date: '2024-01-25',
    };

    const result = await getMoodEntries(dateRange);
    expect(result).toHaveLength(0);
  });

  it('should handle single date range correctly', async () => {
    // Create entries on the exact date and around it
    await createTestMoodEntry({
      mood_rating: 1,
      note: 'Before',
      date: '2024-01-14',
    });

    await createTestMoodEntry({
      mood_rating: 3,
      note: 'Exact date 1',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 4,
      note: 'Exact date 2',
      date: '2024-01-15',
    });

    await createTestMoodEntry({
      mood_rating: 2,
      note: 'After',
      date: '2024-01-16',
    });

    const dateRange: DateRangeInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-15',
    };

    const result = await getMoodEntries(dateRange);

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.date).toEqual(new Date('2024-01-15'));
      expect(['Exact date 1', 'Exact date 2']).toContain(entry.note);
    });
  });
});
