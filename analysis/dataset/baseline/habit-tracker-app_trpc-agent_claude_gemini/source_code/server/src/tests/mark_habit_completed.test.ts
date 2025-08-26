import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type MarkHabitCompletedInput } from '../schema';
import { markHabitCompleted } from '../handlers/mark_habit_completed';
import { eq, and } from 'drizzle-orm';

describe('markHabitCompleted', () => {
  let testHabitId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();
    
    testHabitId = habitResult[0].id;
  });

  afterEach(resetDB);

  it('should mark a habit as completed with default date', async () => {
    const input: MarkHabitCompletedInput = {
      habit_id: testHabitId
    };

    const result = await markHabitCompleted(input);

    // Verify returned completion
    expect(result.habit_id).toEqual(testHabitId);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    // Verify today's date is used
    const today = new Date().toISOString().split('T')[0];
    const completedDate = result.completed_at.toISOString().split('T')[0];
    expect(completedDate).toEqual(today);
  });

  it('should mark a habit as completed with specific date', async () => {
    const specificDate = new Date('2024-01-15');
    const input: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    const result = await markHabitCompleted(input);

    // Verify returned completion uses specific date
    expect(result.habit_id).toEqual(testHabitId);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
  });

  it('should save completion to database', async () => {
    const specificDate = new Date('2024-01-20');
    const input: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    const result = await markHabitCompleted(input);

    // Query database to verify record was created
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.id, result.id))
      .execute();

    expect(completions).toHaveLength(1);
    const completion = completions[0];
    expect(completion.habit_id).toEqual(testHabitId);
    expect(completion.completed_at).toEqual('2024-01-20');
    expect(completion.created_at).toBeInstanceOf(Date);
  });

  it('should return existing completion if already marked for the same date', async () => {
    const specificDate = new Date('2024-01-25');
    const input: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    // Mark habit as completed first time
    const firstResult = await markHabitCompleted(input);

    // Try to mark the same habit as completed on the same date again
    const secondResult = await markHabitCompleted(input);

    // Should return the same completion record
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.habit_id).toEqual(firstResult.habit_id);
    expect(secondResult.completed_at.toISOString()).toEqual(firstResult.completed_at.toISOString());
    expect(secondResult.created_at.toISOString()).toEqual(firstResult.created_at.toISOString());

    // Verify only one record exists in database
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, testHabitId),
          eq(habitCompletionsTable.completed_at, '2024-01-25')
        )
      )
      .execute();

    expect(completions).toHaveLength(1);
  });

  it('should allow multiple completions for the same habit on different dates', async () => {
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-11');

    const input1: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: date1
    };

    const input2: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: date2
    };

    // Mark habit as completed on two different dates
    const result1 = await markHabitCompleted(input1);
    const result2 = await markHabitCompleted(input2);

    // Should create separate records
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.completed_at.toISOString().split('T')[0]).toEqual('2024-01-10');
    expect(result2.completed_at.toISOString().split('T')[0]).toEqual('2024-01-11');

    // Verify both records exist in database
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, testHabitId))
      .execute();

    expect(completions).toHaveLength(2);
  });

  it('should throw error for non-existent habit', async () => {
    const nonExistentHabitId = 99999;
    const input: MarkHabitCompletedInput = {
      habit_id: nonExistentHabitId
    };

    await expect(markHabitCompleted(input)).rejects.toThrow(/habit with id 99999 not found/i);
  });

  it('should handle date edge cases correctly', async () => {
    // Test with start of day
    const startOfDay = new Date('2024-02-01T00:00:00.000Z');
    const input1: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: startOfDay
    };

    // Test with end of day
    const endOfDay = new Date('2024-02-01T23:59:59.999Z');
    const input2: MarkHabitCompletedInput = {
      habit_id: testHabitId,
      completed_at: endOfDay
    };

    const result1 = await markHabitCompleted(input1);
    const result2 = await markHabitCompleted(input2);

    // Both should be treated as the same date (2024-02-01)
    // Second call should return existing completion
    expect(result1.id).toEqual(result2.id);
    expect(result1.completed_at.toISOString().split('T')[0]).toEqual('2024-02-01');
    expect(result2.completed_at.toISOString().split('T')[0]).toEqual('2024-02-01');
  });
});
