import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreCompletionInput } from '../schema';
import { updateChoreCompletion } from '../handlers/update_chore_completion';
import { eq } from 'drizzle-orm';

describe('updateChoreCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update chore completion status to true', async () => {
    // Create a test chore first
    const choreData = await db.insert(choresTable)
      .values({
        name: 'Wash dishes',
        is_completed: false,
        assigned_date: new Date('2023-10-16')
      })
      .returning()
      .execute();

    const createdChore = choreData[0];

    // Update completion status to true
    const updateInput: UpdateChoreCompletionInput = {
      id: createdChore.id,
      is_completed: true
    };

    const result = await updateChoreCompletion(updateInput);

    // Verify the returned chore
    expect(result.id).toEqual(createdChore.id);
    expect(result.name).toEqual('Wash dishes');
    expect(result.is_completed).toBe(true);
    expect(result.assigned_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update chore completion status to false', async () => {
    // Create a completed test chore
    const choreData = await db.insert(choresTable)
      .values({
        name: 'Take out trash',
        is_completed: true,
        assigned_date: new Date('2023-10-16')
      })
      .returning()
      .execute();

    const createdChore = choreData[0];

    // Update completion status to false
    const updateInput: UpdateChoreCompletionInput = {
      id: createdChore.id,
      is_completed: false
    };

    const result = await updateChoreCompletion(updateInput);

    // Verify the returned chore
    expect(result.id).toEqual(createdChore.id);
    expect(result.name).toEqual('Take out trash');
    expect(result.is_completed).toBe(false);
    expect(result.assigned_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the update in the database', async () => {
    // Create a test chore
    const choreData = await db.insert(choresTable)
      .values({
        name: 'Clean bathroom',
        is_completed: false,
        assigned_date: new Date('2023-10-16')
      })
      .returning()
      .execute();

    const createdChore = choreData[0];

    // Update completion status
    const updateInput: UpdateChoreCompletionInput = {
      id: createdChore.id,
      is_completed: true
    };

    await updateChoreCompletion(updateInput);

    // Verify the update was persisted in the database
    const updatedChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, createdChore.id))
      .execute();

    expect(updatedChores).toHaveLength(1);
    expect(updatedChores[0].is_completed).toBe(true);
    expect(updatedChores[0].name).toEqual('Clean bathroom');
  });

  it('should not modify other chore properties', async () => {
    // Create a test chore
    const originalDate = new Date('2023-10-15');
    const choreData = await db.insert(choresTable)
      .values({
        name: 'Vacuum living room',
        is_completed: false,
        assigned_date: originalDate
      })
      .returning()
      .execute();

    const createdChore = choreData[0];

    // Update completion status
    const updateInput: UpdateChoreCompletionInput = {
      id: createdChore.id,
      is_completed: true
    };

    const result = await updateChoreCompletion(updateInput);

    // Verify other properties remain unchanged
    expect(result.name).toEqual(createdChore.name);
    expect(result.assigned_date).toEqual(createdChore.assigned_date);
    expect(result.created_at).toEqual(createdChore.created_at);
  });

  it('should throw error when chore does not exist', async () => {
    const updateInput: UpdateChoreCompletionInput = {
      id: 99999, // Non-existent ID
      is_completed: true
    };

    await expect(updateChoreCompletion(updateInput))
      .rejects.toThrow(/chore with id 99999 not found/i);
  });

  it('should handle multiple updates to the same chore', async () => {
    // Create a test chore
    const choreData = await db.insert(choresTable)
      .values({
        name: 'Mow lawn',
        is_completed: false,
        assigned_date: new Date('2023-10-16')
      })
      .returning()
      .execute();

    const createdChore = choreData[0];

    // First update: mark as completed
    let updateInput: UpdateChoreCompletionInput = {
      id: createdChore.id,
      is_completed: true
    };

    let result = await updateChoreCompletion(updateInput);
    expect(result.is_completed).toBe(true);

    // Second update: mark as incomplete
    updateInput = {
      id: createdChore.id,
      is_completed: false
    };

    result = await updateChoreCompletion(updateInput);
    expect(result.is_completed).toBe(false);

    // Third update: mark as completed again
    updateInput = {
      id: createdChore.id,
      is_completed: true
    };

    result = await updateChoreCompletion(updateInput);
    expect(result.is_completed).toBe(true);

    // Verify final state in database
    const finalChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, createdChore.id))
      .execute();

    expect(finalChore[0].is_completed).toBe(true);
  });
});
