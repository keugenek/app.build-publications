import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput } from '../schema';
import { updateHabit } from '../handlers/update_habit';
import { eq } from 'drizzle-orm';

describe('updateHabit', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test habit to update
    await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a habit name', async () => {
    // First get the habit ID
    const [habit] = await db.select({ id: habitsTable.id })
      .from(habitsTable)
      .where(eq(habitsTable.name, 'Test Habit'))
      .execute();
    
    const input: UpdateHabitInput = {
      id: habit.id,
      name: 'Updated Habit Name'
    };

    const result = await updateHabit(input);

    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Updated Habit Name');
    expect(result.description).toEqual('A habit for testing');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a habit description', async () => {
    // First get the habit ID
    const [habit] = await db.select({ id: habitsTable.id })
      .from(habitsTable)
      .where(eq(habitsTable.name, 'Test Habit'))
      .execute();
    
    const input: UpdateHabitInput = {
      id: habit.id,
      description: 'Updated habit description'
    };

    const result = await updateHabit(input);

    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toEqual('Updated habit description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // First get the habit ID
    const [habit] = await db.select({ id: habitsTable.id })
      .from(habitsTable)
      .where(eq(habitsTable.name, 'Test Habit'))
      .execute();
    
    const input: UpdateHabitInput = {
      id: habit.id,
      name: 'Completely Updated Habit',
      description: 'A completely updated description'
    };

    const result = await updateHabit(input);

    expect(result.id).toEqual(habit.id);
    expect(result.name).toEqual('Completely Updated Habit');
    expect(result.description).toEqual('A completely updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated habit to database', async () => {
    // First get the habit ID
    const [habit] = await db.select({ id: habitsTable.id })
      .from(habitsTable)
      .where(eq(habitsTable.name, 'Test Habit'))
      .execute();
    
    const input: UpdateHabitInput = {
      id: habit.id,
      name: 'Database Updated Habit'
    };

    const result = await updateHabit(input);

    // Query the database to verify the update was saved
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Database Updated Habit');
    expect(habits[0].description).toEqual('A habit for testing');
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent habit', async () => {
    const input: UpdateHabitInput = {
      id: 99999,
      name: 'Non-existent habit'
    };

    await expect(updateHabit(input)).rejects.toThrow(/not found/);
  });
});
