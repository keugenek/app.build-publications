import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput } from '../schema';
import { getWellnessEntry } from '../handlers/get_wellness_entry';

describe('getWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a wellness entry by id and user_id', async () => {
    // Create test wellness entry
    const testDate = new Date('2024-01-15');
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-15', // Use string format for date column
        hours_of_sleep: 7.5,
        stress_level: 4,
        caffeine_intake: 150.0,
        alcohol_intake: 1.5,
        wellness_score: 85.2
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 1
    };

    const result = await getWellnessEntry(input);

    // Verify the entry is returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdEntry.id);
    expect(result!.user_id).toBe(1);
    expect(result!.date).toEqual(testDate);
    expect(result!.hours_of_sleep).toBe(7.5);
    expect(result!.stress_level).toBe(4);
    expect(result!.caffeine_intake).toBe(150.0);
    expect(result!.alcohol_intake).toBe(1.5);
    expect(result!.wellness_score).toBe(85.2);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result!.hours_of_sleep).toBe('number');
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(typeof result!.alcohol_intake).toBe('number');
    expect(typeof result!.wellness_score).toBe('number');
  });

  it('should return null for non-existent wellness entry', async () => {
    const input: GetWellnessEntryInput = {
      id: 999, // Non-existent ID
      user_id: 1
    };

    const result = await getWellnessEntry(input);

    expect(result).toBeNull();
  });

  it('should return null when entry exists but belongs to different user', async () => {
    // Create wellness entry for user 1
    const testDate = new Date('2024-01-15');
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-15', // Use string format for date column
        hours_of_sleep: 8.0,
        stress_level: 3,
        caffeine_intake: 100.0,
        alcohol_intake: 0.0,
        wellness_score: 90.0
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    // Try to access the entry as user 2 (security check)
    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 2 // Different user
    };

    const result = await getWellnessEntry(input);

    expect(result).toBeNull();
  });

  it('should handle decimal values correctly', async () => {
    // Create entry with specific decimal values
    const testDate = new Date('2024-01-20');
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-20', // Use string format for date column
        hours_of_sleep: 6.75,
        stress_level: 7,
        caffeine_intake: 175.25,
        alcohol_intake: 2.5,
        wellness_score: 72.8
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 1
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.hours_of_sleep).toBe(6.75);
    expect(result!.caffeine_intake).toBe(175.25);
    expect(result!.alcohol_intake).toBe(2.5);
    expect(result!.wellness_score).toBe(72.8);
  });

  it('should handle zero values correctly', async () => {
    // Create entry with zero values
    const testDate = new Date('2024-02-01');
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 3,
        date: '2024-02-01', // Use string format for date column
        hours_of_sleep: 0.0,
        stress_level: 1,
        caffeine_intake: 0.0,
        alcohol_intake: 0.0,
        wellness_score: 50.0
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];

    const input: GetWellnessEntryInput = {
      id: createdEntry.id,
      user_id: 3
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.hours_of_sleep).toBe(0.0);
    expect(result!.caffeine_intake).toBe(0.0);
    expect(result!.alcohol_intake).toBe(0.0);
    expect(result!.stress_level).toBe(1);
    expect(result!.wellness_score).toBe(50.0);
  });

  it('should verify database query uses both id and user_id filters', async () => {
    // Create multiple entries for different users
    const testDate = new Date('2024-01-10');
    
    // User 1 entry
    const user1Result = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-10', // Use string format for date column
        hours_of_sleep: 8.0,
        stress_level: 2,
        caffeine_intake: 50.0,
        alcohol_intake: 0.0,
        wellness_score: 95.0
      })
      .returning()
      .execute();

    // User 2 entry
    await db.insert(wellnessEntriesTable)
      .values({
        user_id: 2,
        date: '2024-01-10', // Use string format for date column
        hours_of_sleep: 6.0,
        stress_level: 8,
        caffeine_intake: 300.0,
        alcohol_intake: 3.0,
        wellness_score: 60.0
      })
      .returning()
      .execute();

    // Access user 1's entry with correct user_id
    const input: GetWellnessEntryInput = {
      id: user1Result[0].id,
      user_id: 1
    };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.user_id).toBe(1);
    expect(result!.wellness_score).toBe(95.0);

    // Verify we can't access with wrong user_id
    const wrongUserInput: GetWellnessEntryInput = {
      id: user1Result[0].id,
      user_id: 2 // Wrong user
    };

    const wrongUserResult = await getWellnessEntry(wrongUserInput);
    expect(wrongUserResult).toBeNull();
  });
});
