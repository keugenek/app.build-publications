import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type LogMoodInput } from '../schema';
import { getMoods } from '../handlers/get_moods';

// Test mood entries
const testMoods: LogMoodInput[] = [
  {
    mood: 5,
    description: 'Feeling great today!'
  },
  {
    mood: 3,
    description: 'Average day'
  },
  {
    mood: 1,
    description: 'Not feeling well'
  }
];

describe('getMoods', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const mood of testMoods) {
      await db.insert(moodsTable)
        .values({
          mood: mood.mood,
          description: mood.description
        })
        .execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all moods from the database', async () => {
    const result = await getMoods();

    expect(result).toHaveLength(3);
    
    // Check that all moods are returned with correct properties
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('mood');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('created_at');
    
    // Verify data integrity
    expect(result[0].mood).toBe(5);
    expect(result[0].description).toBe('Feeling great today!');
    expect(result[1].mood).toBe(3);
    expect(result[1].description).toBe('Average day');
    expect(result[2].mood).toBe(1);
    expect(result[2].description).toBe('Not feeling well');
  });

  it('should return moods ordered by creation date', async () => {
    const result = await getMoods();
    
    // Check that moods are ordered by created_at (ascending by default)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeLessThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should handle empty moods table', async () => {
    // Clear the table first
    await db.delete(moodsTable).execute();
    
    const result = await getMoods();
    
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should properly handle moods with null descriptions', async () => {
    // Insert a mood with null description
    await db.insert(moodsTable)
      .values({
        mood: 4,
        description: null
      })
      .execute();

    const result = await getMoods();
    
    // Find the mood with null description
    const moodWithNullDescription = result.find(mood => mood.mood === 4);
    expect(moodWithNullDescription).toBeDefined();
    expect(moodWithNullDescription?.description).toBeNull();
  });
});
