import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput, type CreateHabitInput } from '../schema';
import { updateHabit } from '../handlers/update_habit';
import { eq } from 'drizzle-orm';

// Helper function to create a test habit
const createTestHabit = async (habitData: CreateHabitInput) => {
  const result = await db.insert(habitsTable)
    .values({
      name: habitData.name,
      description: habitData.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update habit name only', async () => {
    // Create a test habit
    const habit = await createTestHabit({
      name: 'Original Habit',
      description: 'Original description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      name: 'Updated Habit Name'
    };

    const result = await updateHabit(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Updated Habit Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update habit description only', async () => {
    // Create a test habit
    const habit = await createTestHabit({
      name: 'Test Habit',
      description: 'Original description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      description: 'Updated description'
    };

    const result = await updateHabit(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Test Habit'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a test habit
    const habit = await createTestHabit({
      name: 'Original Habit',
      description: 'Original description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      name: 'Updated Habit Name',
      description: 'Updated description'
    };

    const result = await updateHabit(updateInput);

    // Verify both fields are updated
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Updated Habit Name');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a test habit with description
    const habit = await createTestHabit({
      name: 'Test Habit',
      description: 'Original description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      description: null
    };

    const result = await updateHabit(updateInput);

    // Verify description is set to null
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Test Habit'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return existing habit when no fields to update', async () => {
    // Create a test habit
    const habit = await createTestHabit({
      name: 'Test Habit',
      description: 'Test description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id
      // No name or description provided
    };

    const result = await updateHabit(updateInput);

    // Should return the existing habit unchanged
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toEqual('Test description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create a test habit
    const habit = await createTestHabit({
      name: 'Original Habit',
      description: 'Original description'
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      name: 'Database Updated Habit',
      description: 'Database updated description'
    };

    await updateHabit(updateInput);

    // Query database directly to verify changes were saved
    const savedHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(savedHabit).toHaveLength(1);
    expect(savedHabit[0].name).toEqual('Database Updated Habit');
    expect(savedHabit[0].description).toEqual('Database updated description');
    expect(savedHabit[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle habit with null description', async () => {
    // Create a test habit with null description
    const habit = await createTestHabit({
      name: 'Test Habit',
      description: null
    });

    const updateInput: UpdateHabitInput = {
      id: habit.id,
      name: 'Updated Habit Name'
    };

    const result = await updateHabit(updateInput);

    // Verify update works with null description
    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Updated Habit Name');
    expect(result.description).toBeNull(); // Should remain null
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent habit', async () => {
    const updateInput: UpdateHabitInput = {
      id: 9999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateHabit(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for non-existent habit with no updates', async () => {
    const updateInput: UpdateHabitInput = {
      id: 9999 // Non-existent ID, no updates
    };

    await expect(updateHabit(updateInput)).rejects.toThrow(/not found/i);
  });
});
