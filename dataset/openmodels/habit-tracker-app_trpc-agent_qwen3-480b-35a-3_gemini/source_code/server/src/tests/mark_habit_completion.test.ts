import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type CreateHabitInput, type MarkHabitCompletionInput } from '../schema';
import { markHabitCompletion } from '../handlers/mark_habit_completion';
import { eq, and } from 'drizzle-orm';

// Helper function to create a habit
const createHabit = async (input: CreateHabitInput) => {
  const result = await db.insert(habitsTable)
    .values({
      name: input.name,
      description: input.description
    })
    .returning()
    .execute();
  return result[0];
};

describe('markHabitCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new habit completion when none exists', async () => {
    // First create a habit
    const habit = await createHabit({
      name: 'Test Habit',
      description: 'A habit for testing'
    });

    const testDate = new Date('2023-01-01');
    const input: MarkHabitCompletionInput = {
      habit_id: habit.id,
      date: testDate,
      completed: true
    };

    await markHabitCompletion(input);

    // Verify completion was created
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, habit.id),
        eq(habitCompletionsTable.date, '2023-01-01')
      ))
      .execute();

    expect(completions).toHaveLength(1);
    expect(completions[0].habit_id).toEqual(habit.id);
    expect(completions[0].date).toEqual('2023-01-01');
    expect(completions[0].completed).toEqual(true);
    expect(completions[0].created_at).toBeInstanceOf(Date);
  });

  it('should update an existing habit completion', async () => {
    // First create a habit
    const habit = await createHabit({
      name: 'Test Habit',
      description: 'A habit for testing'
    });

    const testDate = new Date('2023-01-01');
    
    // Create initial completion
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit.id,
        date: '2023-01-01',
        completed: true
      })
      .execute();

    // Update completion to false
    const input: MarkHabitCompletionInput = {
      habit_id: habit.id,
      date: testDate,
      completed: false
    };

    await markHabitCompletion(input);

    // Verify completion was updated
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, habit.id),
        eq(habitCompletionsTable.date, '2023-01-01')
      ))
      .execute();

    expect(completions).toHaveLength(1);
    expect(completions[0].completed).toEqual(false);
  });

  it('should handle multiple habits independently', async () => {
    // Create two habits
    const habit1 = await createHabit({
      name: 'Habit 1',
      description: 'First habit'
    });

    const habit2 = await createHabit({
      name: 'Habit 2',
      description: 'Second habit'
    });

    const testDate = new Date('2023-01-01');

    // Mark habit 1 as completed
    await markHabitCompletion({
      habit_id: habit1.id,
      date: testDate,
      completed: true
    });

    // Mark habit 2 as not completed
    await markHabitCompletion({
      habit_id: habit2.id,
      date: testDate,
      completed: false
    });

    // Verify completions
    const completions = await db.select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.date, '2023-01-01'))
      .execute();

    expect(completions).toHaveLength(2);
    
    const habit1Completion = completions.find(c => c.habit_id === habit1.id);
    const habit2Completion = completions.find(c => c.habit_id === habit2.id);
    
    expect(habit1Completion).toBeDefined();
    expect(habit1Completion!.completed).toEqual(true);
    
    expect(habit2Completion).toBeDefined();
    expect(habit2Completion!.completed).toEqual(false);
  });

  it('should work with different dates for the same habit', async () => {
    // Create a habit
    const habit = await createHabit({
      name: 'Test Habit',
      description: 'A habit for testing'
    });

    const date1 = new Date('2023-01-01');
    const date2 = new Date('2023-01-02');

    // Mark habit as completed on date1
    await markHabitCompletion({
      habit_id: habit.id,
      date: date1,
      completed: true
    });

    // Mark habit as not completed on date2
    await markHabitCompletion({
      habit_id: habit.id,
      date: date2,
      completed: false
    });

    // Verify completions for each date
    const completionsDate1 = await db.select()
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, habit.id),
        eq(habitCompletionsTable.date, '2023-01-01')
      ))
      .execute();

    const completionsDate2 = await db.select()
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, habit.id),
        eq(habitCompletionsTable.date, '2023-01-02')
      ))
      .execute();

    expect(completionsDate1).toHaveLength(1);
    expect(completionsDate1[0].completed).toEqual(true);

    expect(completionsDate2).toHaveLength(1);
    expect(completionsDate2[0].completed).toEqual(false);
  });
});
