import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput } from '../schema';
import { updateHabit } from '../handlers/update_habit';
import { eq } from 'drizzle-orm';

describe('updateHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update habit name only', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Original Habit',
        description: 'Original description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;

    // Update only the name
    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Updated Habit Name'
    };

    const result = await updateHabit(updateInput);

    // Verify the result
    expect(result.id).toBe(habitId);
    expect(result.name).toBe('Updated Habit Name');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    expect(dbHabit[0].name).toBe('Updated Habit Name');
    expect(dbHabit[0].description).toBe('Original description');
    expect(dbHabit[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update habit description only', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Original description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;

    // Update only the description
    const updateInput: UpdateHabitInput = {
      id: habitId,
      description: 'Updated description'
    };

    const result = await updateHabit(updateInput);

    // Verify the result
    expect(result.id).toBe(habitId);
    expect(result.name).toBe('Test Habit'); // Should remain unchanged
    expect(result.description).toBe('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Original Habit',
        description: 'Original description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;

    // Update both fields
    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Updated Habit',
      description: 'Updated description'
    };

    const result = await updateHabit(updateInput);

    // Verify the result
    expect(result.id).toBe(habitId);
    expect(result.name).toBe('Updated Habit');
    expect(result.description).toBe('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const dbHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    expect(dbHabit[0].name).toBe('Updated Habit');
    expect(dbHabit[0].description).toBe('Updated description');
  });

  it('should set description to null when explicitly provided', async () => {
    // Create a habit with description first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Has description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;

    // Update description to null
    const updateInput: UpdateHabitInput = {
      id: habitId,
      description: null
    };

    const result = await updateHabit(updateInput);

    // Verify the result
    expect(result.id).toBe(habitId);
    expect(result.name).toBe('Test Habit'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const dbHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    expect(dbHabit[0].description).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Test description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the habit
    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Updated Habit'
    };

    const result = await updateHabit(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when habit does not exist', async () => {
    const updateInput: UpdateHabitInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateHabit(updateInput)).rejects.toThrow(/habit with id 99999 not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Test description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;

    // Update the habit
    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Updated Habit'
    };

    const result = await updateHabit(updateInput);

    // Verify created_at was not changed
    expect(result.created_at.getTime()).toBe(originalCreatedAt.getTime());
  });

  it('should handle empty update gracefully', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Test description'
      })
      .returning()
      .execute();

    const habitId = createResult[0].id;

    // Update with only ID (no other fields)
    const updateInput: UpdateHabitInput = {
      id: habitId
    };

    const result = await updateHabit(updateInput);

    // Verify the habit is returned unchanged except for updated_at
    expect(result.id).toBe(habitId);
    expect(result.name).toBe('Test Habit');
    expect(result.description).toBe('Test description');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
