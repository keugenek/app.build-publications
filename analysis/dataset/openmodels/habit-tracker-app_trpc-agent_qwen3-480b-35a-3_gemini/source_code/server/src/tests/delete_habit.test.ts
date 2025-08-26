import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { deleteHabit } from '../handlers/delete_habit';
import { eq } from 'drizzle-orm';

describe('deleteHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a habit and its completions', async () => {
    // Create a habit first
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();

    // Create some habit completions
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit.id,
        date: '2023-01-01',
        completed: true
      })
      .execute();
      
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit.id,
        date: '2023-01-02',
        completed: false
      })
      .execute();

    // Delete the habit
    await deleteHabit(habit.id);

    // Verify habit is deleted
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();
    
    expect(habits).toHaveLength(0);

    // Verify habit completions are also deleted
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit.id))
      .execute();
    
    expect(completions).toHaveLength(0);
  });

  it('should not throw an error when deleting a non-existent habit', async () => {
    // This should not throw an error
    await expect(deleteHabit(99999)).resolves.toBeUndefined();
  });

  it('should only delete completions for the specified habit', async () => {
    // Create two habits
    const [habit1] = await db.insert(habitsTable)
      .values({ name: 'Habit 1', description: 'First habit' })
      .returning()
      .execute();

    const [habit2] = await db.insert(habitsTable)
      .values({ name: 'Habit 2', description: 'Second habit' })
      .returning()
      .execute();

    // Create completions for both habits
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit1.id,
        date: '2023-01-01',
        completed: true
      })
      .execute();

    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit2.id,
        date: '2023-01-01',
        completed: true
      })
      .execute();

    // Delete habit1
    await deleteHabit(habit1.id);

    // Verify habit1 is deleted
    const habits1 = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit1.id))
      .execute();
    expect(habits1).toHaveLength(0);

    // Verify habit1's completions are deleted
    const completions1 = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit1.id))
      .execute();
    expect(completions1).toHaveLength(0);

    // Verify habit2 still exists
    const habits2 = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit2.id))
      .execute();
    expect(habits2).toHaveLength(1);

    // Verify habit2's completions still exist
    const completions2 = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habit2.id))
      .execute();
    expect(completions2).toHaveLength(1);
  });
});
