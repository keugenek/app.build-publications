import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckinsTable } from '../db/schema';
import { type MarkHabitCompleteInput } from '../schema';
import { markHabitComplete } from '../handlers/mark_habit_complete';
import { eq, and } from 'drizzle-orm';

describe('markHabitComplete', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabitId: number;
  const testDate = '2024-01-15';

  beforeEach(async () => {
    // Create a test habit for each test
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();

    testHabitId = habitResult[0].id;
  });

  it('should create new checkin when none exists', async () => {
    const testInput: MarkHabitCompleteInput = {
      habit_id: testHabitId,
      date: testDate,
      completed: true
    };

    const result = await markHabitComplete(testInput);

    // Verify returned data
    expect(result.habit_id).toBe(testHabitId);
    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify data was saved to database
    const checkins = await db.select()
      .from(habitCheckinsTable)
      .where(eq(habitCheckinsTable.id, result.id))
      .execute();

    expect(checkins).toHaveLength(1);
    expect(checkins[0].habit_id).toBe(testHabitId);
    expect(checkins[0].date).toBe(testDate);
    expect(checkins[0].completed).toBe(true);
  });

  it('should update existing checkin when one exists', async () => {
    // First, create an existing checkin
    const existingCheckin = await db.insert(habitCheckinsTable)
      .values({
        habit_id: testHabitId,
        date: testDate,
        completed: false
      })
      .returning()
      .execute();

    const testInput: MarkHabitCompleteInput = {
      habit_id: testHabitId,
      date: testDate,
      completed: true
    };

    const result = await markHabitComplete(testInput);

    // Should return the updated checkin with same ID
    expect(result.id).toBe(existingCheckin[0].id);
    expect(result.habit_id).toBe(testHabitId);
    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed).toBe(true);

    // Verify only one checkin exists for this habit and date
    const checkins = await db.select()
      .from(habitCheckinsTable)
      .where(
        and(
          eq(habitCheckinsTable.habit_id, testHabitId),
          eq(habitCheckinsTable.date, testDate)
        )
      )
      .execute();

    expect(checkins).toHaveLength(1);
    expect(checkins[0].completed).toBe(true);
  });

  it('should handle marking habit as incomplete', async () => {
    const testInput: MarkHabitCompleteInput = {
      habit_id: testHabitId,
      date: testDate,
      completed: false
    };

    const result = await markHabitComplete(testInput);

    expect(result.completed).toBe(false);

    // Verify in database
    const checkins = await db.select()
      .from(habitCheckinsTable)
      .where(eq(habitCheckinsTable.id, result.id))
      .execute();

    expect(checkins[0].completed).toBe(false);
  });

  it('should update from complete to incomplete', async () => {
    // Create initial completed checkin
    await db.insert(habitCheckinsTable)
      .values({
        habit_id: testHabitId,
        date: testDate,
        completed: true
      })
      .execute();

    const testInput: MarkHabitCompleteInput = {
      habit_id: testHabitId,
      date: testDate,
      completed: false
    };

    const result = await markHabitComplete(testInput);

    expect(result.completed).toBe(false);

    // Verify database was updated
    const checkins = await db.select()
      .from(habitCheckinsTable)
      .where(
        and(
          eq(habitCheckinsTable.habit_id, testHabitId),
          eq(habitCheckinsTable.date, testDate)
        )
      )
      .execute();

    expect(checkins).toHaveLength(1);
    expect(checkins[0].completed).toBe(false);
  });

  it('should handle different dates for same habit', async () => {
    const date1 = '2024-01-15';
    const date2 = '2024-01-16';

    // Mark habit complete for first date
    const result1 = await markHabitComplete({
      habit_id: testHabitId,
      date: date1,
      completed: true
    });

    // Mark habit incomplete for second date
    const result2 = await markHabitComplete({
      habit_id: testHabitId,
      date: date2,
      completed: false
    });

    expect(result1.date).toEqual(new Date(date1));
    expect(result1.completed).toBe(true);
    expect(result2.date).toEqual(new Date(date2));
    expect(result2.completed).toBe(false);

    // Verify both checkins exist in database
    const allCheckins = await db.select()
      .from(habitCheckinsTable)
      .where(eq(habitCheckinsTable.habit_id, testHabitId))
      .execute();

    expect(allCheckins).toHaveLength(2);
  });

  it('should throw error for non-existent habit', async () => {
    const nonExistentHabitId = 99999;
    const testInput: MarkHabitCompleteInput = {
      habit_id: nonExistentHabitId,
      date: testDate,
      completed: true
    };

    await expect(markHabitComplete(testInput)).rejects.toThrow(/does not exist/i);
  });

  it('should handle edge case dates correctly', async () => {
    const edgeDate = '2024-02-29'; // Leap year date

    const testInput: MarkHabitCompleteInput = {
      habit_id: testHabitId,
      date: edgeDate,
      completed: true
    };

    const result = await markHabitComplete(testInput);

    expect(result.date).toEqual(new Date(edgeDate));
    expect(result.completed).toBe(true);

    // Verify database storage
    const checkins = await db.select()
      .from(habitCheckinsTable)
      .where(eq(habitCheckinsTable.id, result.id))
      .execute();

    expect(checkins[0].date).toBe(edgeDate);
  });
});
