import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput } from '../schema';
import { getWellnessEntry } from '../handlers/get_wellness_entry';

// Helper function to calculate wellness score (simple example)
const calculateWellnessScore = (sleepHours: number, stressLevel: number, caffeineIntake: number, alcoholIntake: number): number => {
  // Simple scoring algorithm for testing
  let score = 50; // Base score
  
  // Sleep score (optimal 7-9 hours)
  if (sleepHours >= 7 && sleepHours <= 9) score += 20;
  else if (sleepHours >= 6 && sleepHours < 7) score += 10;
  else if (sleepHours >= 5 && sleepHours < 6) score += 5;
  
  // Stress penalty (lower is better)
  score -= (stressLevel - 1) * 5;
  
  // Caffeine penalty (moderate amounts okay)
  if (caffeineIntake > 400) score -= 10;
  else if (caffeineIntake > 200) score -= 5;
  
  // Alcohol penalty
  if (alcoholIntake > 2) score -= alcoholIntake * 5;
  else if (alcoholIntake > 0) score -= alcoholIntake * 2;
  
  return Math.max(0, Math.min(100, score));
};

// Helper function to create test wellness entry
const createTestWellnessEntry = async (userId: string = 'user123', overrides?: Partial<any>) => {
  const sleepHours = 8.5;
  const stressLevel = 3;
  const caffeineIntake = 150;
  const alcoholIntake = 1;
  const wellnessScore = calculateWellnessScore(sleepHours, stressLevel, caffeineIntake, alcoholIntake);
  
  const entryData = {
    user_id: userId,
    date: '2024-01-15',
    sleep_hours: sleepHours.toString(), // Convert to string for numeric column
    stress_level: stressLevel,
    caffeine_intake: caffeineIntake,
    alcohol_intake: alcoholIntake,
    wellness_score: wellnessScore.toString(), // Convert to string for numeric column
    ...overrides
  };

  const results = await db.insert(wellnessEntriesTable)
    .values(entryData)
    .returning()
    .execute();

  return results[0];
};

describe('getWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a wellness entry for the correct user', async () => {
    // Create a test wellness entry
    const createdEntry = await createTestWellnessEntry('user123');

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 'user123'
    };

    const result = await getWellnessEntry(input);

    // Verify the entry is returned with correct data types
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdEntry.id);
    expect(result!.user_id).toBe('user123');
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.sleep_hours).toBe(8.5);
    expect(typeof result!.sleep_hours).toBe('number'); // Verify numeric conversion
    expect(result!.stress_level).toBe(3);
    expect(result!.caffeine_intake).toBe(150);
    expect(result!.alcohol_intake).toBe(1);
    expect(typeof result!.wellness_score).toBe('number'); // Verify numeric conversion
    expect(result!.wellness_score).toBe(58); // Expected calculated score based on test data
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent entry', async () => {
    const input: GetWellnessEntryInput = {
      id: 999, // Non-existent ID
      user_id: 'user123'
    };

    const result = await getWellnessEntry(input);

    expect(result).toBeNull();
  });

  it('should return null when entry belongs to different user', async () => {
    // Create entry for user123
    const createdEntry = await createTestWellnessEntry('user123');

    // Try to access it with different user ID
    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 'user456' // Different user
    };

    const result = await getWellnessEntry(input);

    // Should return null to prevent unauthorized access
    expect(result).toBeNull();
  });

  it('should handle different data types correctly', async () => {
    // Create entry with edge case values
    const createdEntry = await createTestWellnessEntry('user123', {
      sleep_hours: '6.25', // Decimal sleep hours
      stress_level: 10, // Maximum stress
      caffeine_intake: 0, // No caffeine
      alcohol_intake: 0, // No alcohol
      wellness_score: '42.75' // Decimal wellness score
    });

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 'user123'
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toBe(6.25);
    expect(typeof result!.sleep_hours).toBe('number');
    expect(result!.stress_level).toBe(10);
    expect(result!.caffeine_intake).toBe(0);
    expect(result!.alcohol_intake).toBe(0);
    expect(result!.wellness_score).toBe(42.75);
    expect(typeof result!.wellness_score).toBe('number');
  });

  it('should handle multiple entries and return only the requested one', async () => {
    // Create multiple entries for the same user
    const entry1 = await createTestWellnessEntry('user123', { date: '2024-01-15' });
    const entry2 = await createTestWellnessEntry('user123', { date: '2024-01-16' });
    const entry3 = await createTestWellnessEntry('user456', { date: '2024-01-15' }); // Different user

    // Request specific entry
    const input: GetWellnessEntryInput = {
      id: entry2.id,
      user_id: 'user123'
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(entry2.id);
    expect(result!.date).toEqual(new Date('2024-01-16'));
    expect(result!.user_id).toBe('user123');
  });

  it('should handle date boundaries correctly', async () => {
    // Test with different date formats that should work
    const createdEntry = await createTestWellnessEntry('user123', {
      date: '2024-02-29' // Leap year date
    });

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 'user123'
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-02-29'));
  });
});
