import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type DeleteHabitInput } from '../schema';
import { deleteHabit } from '../handlers/delete_habit';
import { eq } from 'drizzle-orm';

// Test input for deleting a habit
const testDeleteInput: DeleteHabitInput = {
  id: 1
};

describe('deleteHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test habit
  const createTestHabit = async () => {
    const result = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing deletion'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  // Helper function to create a habit completion
  const createTestCompletion = async (habitId: number) => {
    const result = await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        completed_at: '2024-01-15' // Date column expects string format
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should delete an existing habit successfully', async () => {
    // Create a test habit
    const habit = await createTestHabit();
    const deleteInput = { id: habit.id };

    // Delete the habit
    const result = await deleteHabit(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify habit was deleted from database
    const remainingHabits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(remainingHabits).toHaveLength(0);
  });

  it('should cascade delete habit completions when habit is deleted', async () => {
    // Create a test habit
    const habit = await createTestHabit();
    
    // Create some completions for the habit
    await createTestCompletion(habit.id);
    await createTestCompletion(habit.id);

    // Verify completions exist
    const completionsBeforeDelete = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit.id))
      .execute();
    
    expect(completionsBeforeDelete).toHaveLength(2);

    // Delete the habit
    const deleteInput = { id: habit.id };
    const result = await deleteHabit(deleteInput);

    expect(result.success).toBe(true);

    // Verify habit completions were also deleted due to CASCADE
    const completionsAfterDelete = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit.id))
      .execute();
    
    expect(completionsAfterDelete).toHaveLength(0);
  });

  it('should throw error when habit does not exist', async () => {
    const deleteInput = { id: 999 }; // Non-existent habit ID

    await expect(deleteHabit(deleteInput))
      .rejects.toThrow(/habit with id 999 not found/i);
  });

  it('should not affect other habits when deleting one habit', async () => {
    // Create multiple habits
    const habit1 = await createTestHabit();
    const habit2 = await db.insert(habitsTable)
      .values({
        name: 'Another Habit',
        description: 'Should remain after deletion'
      })
      .returning()
      .execute();

    // Create completions for both habits
    await createTestCompletion(habit1.id);
    await createTestCompletion(habit2[0].id);

    // Delete only the first habit
    const deleteInput = { id: habit1.id };
    const result = await deleteHabit(deleteInput);

    expect(result.success).toBe(true);

    // Verify first habit and its completions are deleted
    const deletedHabits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit1.id))
      .execute();
    
    expect(deletedHabits).toHaveLength(0);

    const deletedCompletions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit1.id))
      .execute();
    
    expect(deletedCompletions).toHaveLength(0);

    // Verify second habit and its completions remain
    const remainingHabits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit2[0].id))
      .execute();
    
    expect(remainingHabits).toHaveLength(1);
    expect(remainingHabits[0].name).toEqual('Another Habit');

    const remainingCompletions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit2[0].id))
      .execute();
    
    expect(remainingCompletions).toHaveLength(1);
  });

  it('should handle habit with no completions', async () => {
    // Create a habit without any completions
    const habit = await createTestHabit();
    
    // Verify no completions exist
    const completionsBeforeDelete = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit.id))
      .execute();
    
    expect(completionsBeforeDelete).toHaveLength(0);

    // Delete the habit
    const deleteInput = { id: habit.id };
    const result = await deleteHabit(deleteInput);

    expect(result.success).toBe(true);

    // Verify habit was deleted
    const remainingHabits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(remainingHabits).toHaveLength(0);
  });
});
