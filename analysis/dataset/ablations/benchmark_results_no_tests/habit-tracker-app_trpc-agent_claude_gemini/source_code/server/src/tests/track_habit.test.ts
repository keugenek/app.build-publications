import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type TrackHabitInput } from '../schema';
import { trackHabit } from '../handlers/track_habit';
import { eq, and } from 'drizzle-orm';

describe('trackHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabitId: number;

  beforeEach(async () => {
    // Create a test habit before each test
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();
    
    testHabitId = habitResult[0].id;
  });

  it('should create new habit tracking entry', async () => {
    const input: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: true
    };

    const result = await trackHabit(input);

    // Verify return values
    expect(result.id).toBeDefined();
    expect(result.habit_id).toEqual(testHabitId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tracking entry to database', async () => {
    const input: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: true
    };

    const result = await trackHabit(input);

    // Query database to verify entry was saved
    const trackingEntries = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.id, result.id))
      .execute();

    expect(trackingEntries).toHaveLength(1);
    expect(trackingEntries[0].habit_id).toEqual(testHabitId);
    expect(trackingEntries[0].date).toEqual('2024-01-15');
    expect(trackingEntries[0].completed).toEqual(true);
  });

  it('should update existing tracking entry for same habit and date', async () => {
    const input: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: false
    };

    // Create initial tracking entry
    const firstResult = await trackHabit(input);

    // Update the same habit and date with different completion status
    const updateInput: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: true
    };

    const secondResult = await trackHabit(updateInput);

    // Should return same ID (updated entry, not new one)
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.completed).toEqual(true);

    // Verify only one entry exists in database
    const trackingEntries = await db.select()
      .from(habitTrackingTable)
      .where(
        and(
          eq(habitTrackingTable.habit_id, testHabitId),
          eq(habitTrackingTable.date, '2024-01-15')
        )
      )
      .execute();

    expect(trackingEntries).toHaveLength(1);
    expect(trackingEntries[0].completed).toEqual(true);
  });

  it('should handle multiple dates for same habit', async () => {
    const input1: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: true
    };

    const input2: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-16',
      completed: false
    };

    const result1 = await trackHabit(input1);
    const result2 = await trackHabit(input2);

    // Should create separate entries
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.date).toEqual(new Date('2024-01-15'));
    expect(result2.date).toEqual(new Date('2024-01-16'));
    expect(result1.completed).toEqual(true);
    expect(result2.completed).toEqual(false);

    // Verify both entries exist in database
    const trackingEntries = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, testHabitId))
      .execute();

    expect(trackingEntries).toHaveLength(2);
  });

  it('should handle completion status false', async () => {
    const input: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-01-15',
      completed: false
    };

    const result = await trackHabit(input);

    expect(result.completed).toEqual(false);

    // Verify in database
    const trackingEntry = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.id, result.id))
      .execute();

    expect(trackingEntry[0].completed).toEqual(false);
  });

  it('should throw error for non-existent habit', async () => {
    const input: TrackHabitInput = {
      habit_id: 99999, // Non-existent habit ID
      date: '2024-01-15',
      completed: true
    };

    expect(trackHabit(input)).rejects.toThrow(/habit with id 99999 not found/i);
  });

  it('should handle date format correctly', async () => {
    const input: TrackHabitInput = {
      habit_id: testHabitId,
      date: '2024-12-31',
      completed: true
    };

    const result = await trackHabit(input);

    expect(result.date).toEqual(new Date('2024-12-31'));
    expect(result.date.getFullYear()).toEqual(2024);
    expect(result.date.getMonth()).toEqual(11); // December is month 11 (0-indexed)
    expect(result.date.getDate()).toEqual(31);
  });
});
