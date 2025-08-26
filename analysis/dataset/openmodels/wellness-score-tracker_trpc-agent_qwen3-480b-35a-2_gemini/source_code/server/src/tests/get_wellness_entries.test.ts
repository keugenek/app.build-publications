import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';
import { eq } from 'drizzle-orm';

describe('getWellnessEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(wellnessEntriesTable).values([
      {
        date: '2023-01-15',
        sleep_hours: '7.50',
        stress_level: 5,
        caffeine_intake: '2.00',
        alcohol_intake: '0.00',
        wellness_score: '75.50'
      },
      {
        date: '2023-01-16',
        sleep_hours: '6.00',
        stress_level: 8,
        caffeine_intake: '3.50',
        alcohol_intake: '1.00',
        wellness_score: '62.25'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should retrieve all wellness entries', async () => {
    const results = await getWellnessEntries();

    expect(results).toHaveLength(2);
    
    // Check first entry
    expect(results[0]).toMatchObject({
      date: new Date('2023-01-15'),
      sleep_hours: 7.5,
      stress_level: 5,
      caffeine_intake: 2,
      alcohol_intake: 0,
      wellness_score: 75.5
    });
    
    // Check that timestamps exist and are Date objects
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
    
    // Check second entry
    expect(results[1]).toMatchObject({
      date: new Date('2023-01-16'),
      sleep_hours: 6,
      stress_level: 8,
      caffeine_intake: 3.5,
      alcohol_intake: 1,
      wellness_score: 62.25
    });
    
    // Verify numeric types
    results.forEach(entry => {
      expect(typeof entry.sleep_hours).toBe('number');
      expect(typeof entry.caffeine_intake).toBe('number');
      expect(typeof entry.alcohol_intake).toBe('number');
      expect(typeof entry.wellness_score).toBe('number');
    });
  });

  it('should return empty array when no entries exist', async () => {
    // Clear the table
    await db.delete(wellnessEntriesTable).execute();
    
    const results = await getWellnessEntries();
    
    expect(results).toHaveLength(0);
  });

  it('should return entries ordered by date', async () => {
    const results = await getWellnessEntries();
    
    // Entries should be ordered by date ascending
    expect(results[0].date).toEqual(new Date('2023-01-15'));
    expect(results[1].date).toEqual(new Date('2023-01-16'));
  });
});
