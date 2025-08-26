import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type GetHabitCompletionsInput } from '../schema';
import { getHabitCompletions } from '../handlers/get_habit_completions';

describe('getHabitCompletions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test habit
  const createTestHabit = async (name: string = 'Test Habit') => {
    const result = await db.insert(habitsTable)
      .values({
        name,
        description: 'A test habit'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create habit completion
  const createHabitCompletion = async (habitId: number, completedAt: string) => {
    const result = await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        completed_at: completedAt
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return all habit completions when no filters provided', async () => {
    // Create test habit
    const habit = await createTestHabit();

    // Create multiple completions
    await createHabitCompletion(habit.id, '2024-01-01');
    await createHabitCompletion(habit.id, '2024-01-02');
    await createHabitCompletion(habit.id, '2024-01-03');

    const input: GetHabitCompletionsInput = {};
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(3);
    // Should be ordered by completed_at desc
    expect(result[0].completed_at).toEqual(new Date('2024-01-03'));
    expect(result[1].completed_at).toEqual(new Date('2024-01-02'));
    expect(result[2].completed_at).toEqual(new Date('2024-01-01'));
  });

  it('should filter by habit_id when provided', async () => {
    // Create two habits
    const habit1 = await createTestHabit('Habit 1');
    const habit2 = await createTestHabit('Habit 2');

    // Create completions for both habits
    await createHabitCompletion(habit1.id, '2024-01-01');
    await createHabitCompletion(habit1.id, '2024-01-02');
    await createHabitCompletion(habit2.id, '2024-01-01');

    const input: GetHabitCompletionsInput = {
      habit_id: habit1.id
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(2);
    result.forEach(completion => {
      expect(completion.habit_id).toEqual(habit1.id);
    });
  });

  it('should filter by start_date when provided', async () => {
    const habit = await createTestHabit();

    // Create completions with different dates
    await createHabitCompletion(habit.id, '2024-01-01');
    await createHabitCompletion(habit.id, '2024-01-15');
    await createHabitCompletion(habit.id, '2024-01-30');

    const input: GetHabitCompletionsInput = {
      start_date: new Date('2024-01-15')
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(2);
    expect(result[0].completed_at).toEqual(new Date('2024-01-30'));
    expect(result[1].completed_at).toEqual(new Date('2024-01-15'));
  });

  it('should filter by end_date when provided', async () => {
    const habit = await createTestHabit();

    // Create completions with different dates
    await createHabitCompletion(habit.id, '2024-01-01');
    await createHabitCompletion(habit.id, '2024-01-15');
    await createHabitCompletion(habit.id, '2024-01-30');

    const input: GetHabitCompletionsInput = {
      end_date: new Date('2024-01-15')
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(2);
    expect(result[0].completed_at).toEqual(new Date('2024-01-15'));
    expect(result[1].completed_at).toEqual(new Date('2024-01-01'));
  });

  it('should filter by date range when both start_date and end_date provided', async () => {
    const habit = await createTestHabit();

    // Create completions outside and inside the range
    await createHabitCompletion(habit.id, '2024-01-01'); // Before range
    await createHabitCompletion(habit.id, '2024-01-10'); // In range
    await createHabitCompletion(habit.id, '2024-01-15'); // In range
    await createHabitCompletion(habit.id, '2024-01-25'); // After range

    const input: GetHabitCompletionsInput = {
      start_date: new Date('2024-01-05'),
      end_date: new Date('2024-01-20')
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(2);
    expect(result[0].completed_at).toEqual(new Date('2024-01-15'));
    expect(result[1].completed_at).toEqual(new Date('2024-01-10'));
  });

  it('should combine habit_id and date filters', async () => {
    // Create two habits
    const habit1 = await createTestHabit('Habit 1');
    const habit2 = await createTestHabit('Habit 2');

    // Create completions for both habits
    await createHabitCompletion(habit1.id, '2024-01-01');
    await createHabitCompletion(habit1.id, '2024-01-15');
    await createHabitCompletion(habit2.id, '2024-01-15');
    await createHabitCompletion(habit2.id, '2024-01-30');

    const input: GetHabitCompletionsInput = {
      habit_id: habit1.id,
      start_date: new Date('2024-01-10')
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(1);
    expect(result[0].habit_id).toEqual(habit1.id);
    expect(result[0].completed_at).toEqual(new Date('2024-01-15'));
  });

  it('should return empty array when no completions match filters', async () => {
    const habit = await createTestHabit();
    
    // Create completion outside the date range
    await createHabitCompletion(habit.id, '2024-01-01');

    const input: GetHabitCompletionsInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no completions exist', async () => {
    const input: GetHabitCompletionsInput = {};
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(0);
  });

  it('should return completions with correct data types', async () => {
    const habit = await createTestHabit();
    await createHabitCompletion(habit.id, '2024-01-01');

    const input: GetHabitCompletionsInput = {};
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(1);
    const completion = result[0];
    
    expect(typeof completion.id).toBe('number');
    expect(typeof completion.habit_id).toBe('number');
    expect(completion.completed_at).toBeInstanceOf(Date);
    expect(completion.created_at).toBeInstanceOf(Date);
    expect(completion.habit_id).toEqual(habit.id);
  });

  it('should handle filtering by non-existent habit_id', async () => {
    const habit = await createTestHabit();
    await createHabitCompletion(habit.id, '2024-01-01');

    const input: GetHabitCompletionsInput = {
      habit_id: 99999 // Non-existent habit ID
    };
    const result = await getHabitCompletions(input);

    expect(result).toHaveLength(0);
  });
});
