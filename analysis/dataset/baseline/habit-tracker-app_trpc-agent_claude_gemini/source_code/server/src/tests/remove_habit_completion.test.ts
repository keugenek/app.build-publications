import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type RemoveHabitCompletionInput } from '../schema';
import { removeHabitCompletion } from '../handlers/remove_habit_completion';
import { eq, and } from 'drizzle-orm';

describe('removeHabitCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabit: { id: number };
  let completionDate: Date;

  beforeEach(async () => {
    // Create a test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();

    testHabit = habitResult[0];
    completionDate = new Date('2024-01-15');
  });

  it('should remove existing habit completion', async () => {
    // First create a completion record
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: testHabit.id,
        completed_at: completionDate.toISOString().split('T')[0] // YYYY-MM-DD format
      })
      .execute();

    // Verify completion exists
    const beforeDelete = await db.select()
      .from(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, testHabit.id),
          eq(habitCompletionsTable.completed_at, completionDate.toISOString().split('T')[0])
        )
      )
      .execute();

    expect(beforeDelete).toHaveLength(1);

    // Test input
    const input: RemoveHabitCompletionInput = {
      habit_id: testHabit.id,
      completed_at: completionDate
    };

    // Remove the completion
    const result = await removeHabitCompletion(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify completion was deleted
    const afterDelete = await db.select()
      .from(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, testHabit.id),
          eq(habitCompletionsTable.completed_at, completionDate.toISOString().split('T')[0])
        )
      )
      .execute();

    expect(afterDelete).toHaveLength(0);
  });

  it('should return success when completion does not exist (idempotent)', async () => {
    // Test input for non-existent completion
    const input: RemoveHabitCompletionInput = {
      habit_id: testHabit.id,
      completed_at: completionDate
    };

    // Try to remove non-existent completion
    const result = await removeHabitCompletion(input);

    // Should still return success
    expect(result.success).toBe(true);
  });

  it('should throw error when habit does not exist', async () => {
    const input: RemoveHabitCompletionInput = {
      habit_id: 99999, // Non-existent habit ID
      completed_at: completionDate
    };

    await expect(removeHabitCompletion(input)).rejects.toThrow(/habit with id 99999 not found/i);
  });

  it('should handle different date formats correctly', async () => {
    // Create completion with specific date
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: testHabit.id,
        completed_at: '2024-01-15' // String format
      })
      .execute();

    // Test with Date object that includes time
    const dateWithTime = new Date('2024-01-15T10:30:00Z');
    const input: RemoveHabitCompletionInput = {
      habit_id: testHabit.id,
      completed_at: dateWithTime
    };

    const result = await removeHabitCompletion(input);

    expect(result.success).toBe(true);

    // Verify completion was deleted despite time difference
    const afterDelete = await db.select()
      .from(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, testHabit.id),
          eq(habitCompletionsTable.completed_at, '2024-01-15')
        )
      )
      .execute();

    expect(afterDelete).toHaveLength(0);
  });

  it('should only remove completion for specified habit and date', async () => {
    // Create another habit
    const habit2Result = await db.insert(habitsTable)
      .values({
        name: 'Test Habit 2',
        description: 'Another test habit'
      })
      .returning()
      .execute();

    const testHabit2 = habit2Result[0];

    // Create completions for both habits on the same date
    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: testHabit.id,
          completed_at: '2024-01-15'
        },
        {
          habit_id: testHabit2.id,
          completed_at: '2024-01-15'
        },
        {
          habit_id: testHabit.id,
          completed_at: '2024-01-16' // Different date for same habit
        }
      ])
      .execute();

    // Remove completion for testHabit on 2024-01-15
    const input: RemoveHabitCompletionInput = {
      habit_id: testHabit.id,
      completed_at: new Date('2024-01-15')
    };

    const result = await removeHabitCompletion(input);
    expect(result.success).toBe(true);

    // Verify only the specific completion was removed
    const remainingCompletions = await db.select()
      .from(habitCompletionsTable)
      .execute();

    expect(remainingCompletions).toHaveLength(2);

    // Verify testHabit2's completion on 2024-01-15 still exists
    const habit2Completion = remainingCompletions.find(
      c => c.habit_id === testHabit2.id && c.completed_at === '2024-01-15'
    );
    expect(habit2Completion).toBeDefined();

    // Verify testHabit's completion on 2024-01-16 still exists
    const habit1OtherCompletion = remainingCompletions.find(
      c => c.habit_id === testHabit.id && c.completed_at === '2024-01-16'
    );
    expect(habit1OtherCompletion).toBeDefined();
  });

  it('should handle multiple calls idempotently', async () => {
    // Create a completion record
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: testHabit.id,
        completed_at: completionDate.toISOString().split('T')[0]
      })
      .execute();

    const input: RemoveHabitCompletionInput = {
      habit_id: testHabit.id,
      completed_at: completionDate
    };

    // Call remove multiple times
    const result1 = await removeHabitCompletion(input);
    const result2 = await removeHabitCompletion(input);
    const result3 = await removeHabitCompletion(input);

    // All should return success
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);

    // Verify no completions exist
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, testHabit.id))
      .execute();

    expect(completions).toHaveLength(0);
  });
});
