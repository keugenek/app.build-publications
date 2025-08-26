import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type GetWellBeingEntriesInput, type CreateWellBeingEntryInput } from '../schema';
import { getWellBeingEntries } from '../handlers/get_well_being_entries';
import { eq } from 'drizzle-orm';

// Helper function to create test entries
const createTestEntry = async (entryData: Partial<CreateWellBeingEntryInput> & { date: Date }) => {
  const defaultEntry: CreateWellBeingEntryInput = {
    date: entryData.date,
    sleep_hours: 7.5,
    work_hours: 8.0,
    social_time_hours: 2.5,
    screen_time_hours: 4.0,
    emotional_energy_level: 7
  };

  const entry = { ...defaultEntry, ...entryData };

  const result = await db.insert(wellBeingEntriesTable)
    .values({
      date: entry.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      sleep_hours: entry.sleep_hours,
      work_hours: entry.work_hours,
      social_time_hours: entry.social_time_hours,
      screen_time_hours: entry.screen_time_hours,
      emotional_energy_level: entry.emotional_energy_level
    })
    .returning()
    .execute();

  return result[0];
};

describe('getWellBeingEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getWellBeingEntries();

    expect(result).toEqual([]);
  });

  it('should return all entries without filters', async () => {
    // Create test entries with date-only values
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to match date-only comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await createTestEntry({ 
      date: today, 
      sleep_hours: 8.0, 
      emotional_energy_level: 8 
    });
    await createTestEntry({ 
      date: yesterday, 
      sleep_hours: 7.0, 
      emotional_energy_level: 6 
    });

    const result = await getWellBeingEntries();

    expect(result).toHaveLength(2);
    
    // Verify ordering (most recent first)
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
    expect(result[1].date.toDateString()).toEqual(yesterday.toDateString());

    // Verify numeric conversion
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(result[0].sleep_hours).toBe(8.0);
    expect(result[1].sleep_hours).toBe(7.0);
    expect(result[0].emotional_energy_level).toBe(8);
  });

  it('should apply start_date filter correctly', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create entries across different dates
    await createTestEntry({ date: today });
    await createTestEntry({ date: yesterday });
    await createTestEntry({ date: twoDaysAgo });

    const filters: GetWellBeingEntriesInput = {
      start_date: yesterday,
      limit: 30
    };

    const result = await getWellBeingEntries(filters);

    expect(result).toHaveLength(2);
    expect(result.every(entry => {
      const entryDateStr = entry.date.toISOString().split('T')[0];
      const filterDateStr = yesterday.toISOString().split('T')[0];
      return entryDateStr >= filterDateStr;
    })).toBe(true);
  });

  it('should apply end_date filter correctly', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create entries across different dates
    await createTestEntry({ date: today });
    await createTestEntry({ date: yesterday });
    await createTestEntry({ date: twoDaysAgo });

    const filters: GetWellBeingEntriesInput = {
      end_date: yesterday,
      limit: 30
    };

    const result = await getWellBeingEntries(filters);

    expect(result).toHaveLength(2);
    expect(result.every(entry => {
      const entryDateStr = entry.date.toISOString().split('T')[0];
      const filterDateStr = yesterday.toISOString().split('T')[0];
      return entryDateStr <= filterDateStr;
    })).toBe(true);
  });

  it('should apply both start_date and end_date filters', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Create entries across different dates
    await createTestEntry({ date: today });
    await createTestEntry({ date: yesterday });
    await createTestEntry({ date: twoDaysAgo });
    await createTestEntry({ date: threeDaysAgo });

    const filters: GetWellBeingEntriesInput = {
      start_date: twoDaysAgo,
      end_date: yesterday,
      limit: 30
    };

    const result = await getWellBeingEntries(filters);

    expect(result).toHaveLength(2);
    expect(result.every(entry => {
      const entryDateStr = entry.date.toISOString().split('T')[0];
      const startDateStr = twoDaysAgo.toISOString().split('T')[0];
      const endDateStr = yesterday.toISOString().split('T')[0];
      return entryDateStr >= startDateStr && entryDateStr <= endDateStr;
    })).toBe(true);
  });

  it('should respect limit parameter', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create 5 entries
    for (let i = 0; i < 5; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - i);
      await createTestEntry({ 
        date: entryDate,
        sleep_hours: 7 + i * 0.5 
      });
    }

    const filters: GetWellBeingEntriesInput = {
      limit: 3
    };

    const result = await getWellBeingEntries(filters);

    expect(result).toHaveLength(3);
  });

  it('should use default limit when no input provided', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create 35 entries (more than default limit of 30)
    for (let i = 0; i < 35; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - i);
      await createTestEntry({ 
        date: entryDate 
      });
    }

    const result = await getWellBeingEntries();

    expect(result).toHaveLength(30); // Default limit
  });

  it('should order results by date descending', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];

    // Create 3 entries with different dates
    for (let i = 0; i < 3; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - i);
      dates.push(entryDate);
      await createTestEntry({ date: entryDate });
    }

    const result = await getWellBeingEntries();

    expect(result).toHaveLength(3);
    
    // Verify descending order (most recent first) using date strings for comparison
    for (let i = 0; i < result.length - 1; i++) {
      const currentDateStr = result[i].date.toISOString().split('T')[0];
      const nextDateStr = result[i + 1].date.toISOString().split('T')[0];
      expect(currentDateStr >= nextDateStr).toBe(true);
    }
  });

  it('should convert all numeric fields correctly', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await createTestEntry({
      date: today,
      sleep_hours: 8.25,
      work_hours: 7.75,
      social_time_hours: 3.5,
      screen_time_hours: 5.25,
      emotional_energy_level: 9
    });

    const result = await getWellBeingEntries();

    expect(result).toHaveLength(1);
    const entry = result[0];

    // Verify all numeric types
    expect(typeof entry.sleep_hours).toBe('number');
    expect(typeof entry.work_hours).toBe('number');
    expect(typeof entry.social_time_hours).toBe('number');
    expect(typeof entry.screen_time_hours).toBe('number');
    expect(typeof entry.emotional_energy_level).toBe('number');

    // Verify values
    expect(entry.sleep_hours).toBe(8.25);
    expect(entry.work_hours).toBe(7.75);
    expect(entry.social_time_hours).toBe(3.5);
    expect(entry.screen_time_hours).toBe(5.25);
    expect(entry.emotional_energy_level).toBe(9);
  });

  it('should handle empty date range correctly', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 10);

    await createTestEntry({ date: today });

    const filters: GetWellBeingEntriesInput = {
      start_date: futureDate,
      end_date: futureDate,
      limit: 30
    };

    const result = await getWellBeingEntries(filters);

    expect(result).toEqual([]);
  });
});
