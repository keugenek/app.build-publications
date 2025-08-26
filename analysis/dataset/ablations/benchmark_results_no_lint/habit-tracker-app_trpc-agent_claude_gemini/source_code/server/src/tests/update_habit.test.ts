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

  it('should update habit name', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Updated Name'
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Original description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update habit description', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      description: 'Updated description'
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'New Name',
      description: 'New description'
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('New Name');
    expect(result.description).toEqual('New description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      description: null
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated habit to database', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      name: 'Database Test Name',
      description: 'Database Test Description'
    };

    await updateHabit(updateInput);

    // Verify the changes were saved to database
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Database Test Name');
    expect(habits[0].description).toEqual('Database Test Description');
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing habit when no fields provided for update', async () => {
    // Create a habit first
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Unchanged Name',
        description: 'Unchanged description'
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Unchanged Name');
    expect(result.description).toEqual('Unchanged description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when habit not found', async () => {
    const updateInput: UpdateHabitInput = {
      id: 999999, // Non-existent ID
      name: 'New Name'
    };

    await expect(updateHabit(updateInput)).rejects.toThrow(/habit with id 999999 not found/i);
  });

  it('should handle habit with null description initially', async () => {
    // Create a habit with null description
    const createResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: null
      })
      .returning()
      .execute();
    
    const habitId = createResult[0].id;

    const updateInput: UpdateHabitInput = {
      id: habitId,
      description: 'Now has description'
    };

    const result = await updateHabit(updateInput);

    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toEqual('Now has description');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
