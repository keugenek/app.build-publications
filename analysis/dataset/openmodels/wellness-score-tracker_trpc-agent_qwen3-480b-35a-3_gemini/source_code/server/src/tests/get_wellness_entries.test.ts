import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';
import { eq } from 'drizzle-orm';

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no entries exist', async () => {
    const result = await getWellnessEntries();
    expect(result).toEqual([]);
  });

  it('should return wellness entries sorted by date descending', async () => {
    // Insert test data
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for consistent comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    await db.insert(wellnessEntriesTable).values({
      date: today.toISOString().split('T')[0], // Format as YYYY-MM-DD string
      sleep_hours: '8.0',
      stress_level: 3,
      caffeine_intake: 1,
      alcohol_intake: 0,
      wellness_score: '85.00'
    });
    
    await db.insert(wellnessEntriesTable).values({
      date: yesterday.toISOString().split('T')[0], // Format as YYYY-MM-DD string
      sleep_hours: '7.5',
      stress_level: 5,
      caffeine_intake: 2,
      alcohol_intake: 1,
      wellness_score: '70.00'
    });

    const result = await getWellnessEntries();
    
    expect(result).toHaveLength(2);
    // Check that entries are sorted by date descending (newest first)
    expect(result[0].date.toISOString().split('T')[0]).toEqual(today.toISOString().split('T')[0]);
    expect(result[1].date.toISOString().split('T')[0]).toEqual(yesterday.toISOString().split('T')[0]);
    
    // Check that numeric values are properly converted
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(typeof result[0].wellness_score).toBe('number');
    expect(result[0].sleep_hours).toBe(8.0);
    expect(result[0].wellness_score).toBe(85.00);
  });

  it('should convert date strings to Date objects', async () => {
    const testDate = '2023-01-15';
    
    await db.insert(wellnessEntriesTable).values({
      date: testDate,
      sleep_hours: '6.5',
      stress_level: 7,
      caffeine_intake: 3,
      alcohol_intake: 0,
      wellness_score: '65.00'
    });

    const result = await getWellnessEntries();
    
    expect(result).toHaveLength(1);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2023-01-15');
  });
});
