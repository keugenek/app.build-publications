import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';

// Test data
const testEntries: CreateWellnessEntryInput[] = [
  {
    date: new Date('2023-01-01'),
    sleep_hours: 8,
    stress_level: 3,
    caffeine_intake: 1,
    alcohol_intake: 0
  },
  {
    date: new Date('2023-01-02'),
    sleep_hours: 6,
    stress_level: 7,
    caffeine_intake: 3,
    alcohol_intake: 1
  },
  {
    date: new Date('2023-01-03'),
    sleep_hours: 7,
    stress_level: 5,
    caffeine_intake: 2,
    alcohol_intake: 0
  }
];

// Helper function to create a wellness entry
const createWellnessEntry = async (input: CreateWellnessEntryInput) => {
  // Calculate wellness score: higher sleep = better, lower stress = better
  // Inverse stress (10 - stress_level) and normalize values to 0-10 range
  const wellness_score = (
    (input.sleep_hours / 24 * 100) + 
    ((10 - input.stress_level) * 10) + 
    (Math.max(0, 2 - input.caffeine_intake) * 10) + 
    (Math.max(0, 1 - input.alcohol_intake) * 10)
  ) / 4;

  const result = await db.insert(wellnessEntriesTable)
    .values({
      date: input.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      sleep_hours: input.sleep_hours.toString(),
      stress_level: input.stress_level,
      caffeine_intake: input.caffeine_intake,
      alcohol_intake: input.alcohol_intake,
      wellness_score: wellness_score.toString()
    })
    .returning()
    .execute();

  return {
    ...result[0],
    sleep_hours: parseFloat(result[0].sleep_hours),
    wellness_score: parseFloat(result[0].wellness_score)
  };
};

describe('getWellnessTrends', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test entries
    for (const entry of testEntries) {
      await createWellnessEntry(entry);
    }
  });
  
  afterEach(resetDB);

  it('should return wellness trends sorted by date descending', async () => {
    const trends = await getWellnessTrends();

    // Should have 3 entries
    expect(trends).toHaveLength(3);
    
    // Check that entries are sorted by date descending
    expect(trends[0].date).toEqual(new Date('2023-01-03'));
    expect(trends[1].date).toEqual(new Date('2023-01-02'));
    expect(trends[2].date).toEqual(new Date('2023-01-01'));
    
    // Check that wellness scores are numbers
    trends.forEach(trend => {
      expect(typeof trend.wellness_score).toBe('number');
      expect(trend.wellness_score).toBeGreaterThan(0);
    });
  });

  it('should return correct wellness trend data structure', async () => {
    const trends = await getWellnessTrends();

    // Check that each trend has the correct structure
    trends.forEach(trend => {
      expect(trend).toHaveProperty('date');
      expect(trend).toHaveProperty('wellness_score');
      expect(trend.date).toBeInstanceOf(Date);
      expect(typeof trend.wellness_score).toBe('number');
    });
  });

  it('should handle empty database', async () => {
    // Reset database to empty state
    await resetDB();
    await createDB();
    
    const trends = await getWellnessTrends();
    
    // Should return empty array
    expect(trends).toHaveLength(0);
    expect(trends).toEqual([]);
  });
});
