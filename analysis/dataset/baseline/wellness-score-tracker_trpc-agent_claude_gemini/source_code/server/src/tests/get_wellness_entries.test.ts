import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type CreateWellnessEntryInput } from '../schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

// Helper function to calculate wellness score (simplified algorithm)
const calculateWellnessScore = (entry: CreateWellnessEntryInput): number => {
  let score = 100;
  
  // Sleep factor (optimal 7-9 hours)
  const sleepHours = entry.sleep_hours;
  if (sleepHours < 6 || sleepHours > 10) score -= 20;
  else if (sleepHours < 7 || sleepHours > 9) score -= 10;
  
  // Stress factor (lower is better)
  score -= (entry.stress_level - 1) * 5;
  
  // Caffeine factor (moderate intake is ok)
  if (entry.caffeine_intake > 400) score -= 15;
  else if (entry.caffeine_intake > 200) score -= 5;
  
  // Alcohol factor (less is better)
  score -= entry.alcohol_intake * 10;
  
  return Math.max(0, Math.min(100, score));
};

// Helper function to create test wellness entries
const createTestEntry = async (entryInput: CreateWellnessEntryInput) => {
  const wellnessScore = calculateWellnessScore(entryInput);
  
  const result = await db.insert(wellnessEntriesTable)
    .values({
      sleep_hours: entryInput.sleep_hours.toString(),
      stress_level: entryInput.stress_level,
      caffeine_intake: entryInput.caffeine_intake.toString(),
      alcohol_intake: entryInput.alcohol_intake.toString(),
      wellness_score: wellnessScore.toString(),
      entry_date: entryInput.entry_date
    })
    .returning()
    .execute();
    
  return result[0];
};

// Test data
const testEntries: CreateWellnessEntryInput[] = [
  {
    sleep_hours: 8.0,
    stress_level: 3,
    caffeine_intake: 100,
    alcohol_intake: 0,
    entry_date: '2024-01-01'
  },
  {
    sleep_hours: 6.5,
    stress_level: 7,
    caffeine_intake: 250,
    alcohol_intake: 2,
    entry_date: '2024-01-02'
  },
  {
    sleep_hours: 7.5,
    stress_level: 4,
    caffeine_intake: 150,
    alcohol_intake: 1,
    entry_date: '2024-01-03'
  },
  {
    sleep_hours: 9.0,
    stress_level: 2,
    caffeine_intake: 0,
    alcohol_intake: 0,
    entry_date: '2024-01-05'
  }
];

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all wellness entries when no filters applied', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const result = await getWellnessEntries();

    expect(result).toHaveLength(4);
    expect(result[0].sleep_hours).toEqual(8.0);
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(result[0].stress_level).toEqual(3);
    expect(result[0].caffeine_intake).toEqual(100);
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(result[0].alcohol_intake).toEqual(0);
    expect(typeof result[0].alcohol_intake).toBe('number');
    expect(typeof result[0].wellness_score).toBe('number');
    expect(result[0].entry_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should filter entries by start_date', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02'
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(3); // Should get entries from 01-02, 01-03, and 01-05
    expect(result.every(entry => entry.entry_date >= new Date('2024-01-02'))).toBe(true);
  });

  it('should filter entries by end_date', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      end_date: '2024-01-02'
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2); // Should get entries from 01-01 and 01-02
    expect(result.every(entry => entry.entry_date <= new Date('2024-01-02'))).toBe(true);
  });

  it('should filter entries by date range', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02',
      end_date: '2024-01-03'
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2); // Should get entries from 01-02 and 01-03
    expect(result.every(entry => 
      entry.entry_date >= new Date('2024-01-02') && 
      entry.entry_date <= new Date('2024-01-03')
    )).toBe(true);
  });

  it('should limit results when limit is specified', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      limit: 2
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2);
  });

  it('should apply both date filtering and limit', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-02',
      limit: 2
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(2); // Limited to 2 results
    expect(result.every(entry => entry.entry_date >= new Date('2024-01-02'))).toBe(true);
  });

  it('should return empty array when no entries match filter criteria', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      start_date: '2024-02-01',
      end_date: '2024-02-28'
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no entries exist', async () => {
    const result = await getWellnessEntries();

    expect(result).toHaveLength(0);
  });

  it('should handle single date range correctly', async () => {
    // Create test entries
    for (const entry of testEntries) {
      await createTestEntry(entry);
    }

    const input: GetWellnessEntriesInput = {
      start_date: '2024-01-03',
      end_date: '2024-01-03'
    };

    const result = await getWellnessEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].entry_date).toEqual(new Date('2024-01-03'));
  });

  it('should handle wellness entries with decimal values correctly', async () => {
    const decimalEntry: CreateWellnessEntryInput = {
      sleep_hours: 7.75,
      stress_level: 5,
      caffeine_intake: 125.5,
      alcohol_intake: 1.5,
      entry_date: '2024-01-10'
    };

    await createTestEntry(decimalEntry);

    const result = await getWellnessEntries();

    expect(result).toHaveLength(1);
    expect(result[0].sleep_hours).toEqual(7.75);
    expect(result[0].caffeine_intake).toEqual(125.5);
    expect(result[0].alcohol_intake).toEqual(1.5);
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(typeof result[0].alcohol_intake).toBe('number');
    expect(typeof result[0].wellness_score).toBe('number');
  });
});
