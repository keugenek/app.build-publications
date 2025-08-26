import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreInput, type Chore } from '../schema';
import { updateChore } from '../handlers/update_chore';
import { eq } from 'drizzle-orm';

describe('updateChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test chore
  const createTestChore = async (name: string = 'Original Chore', description: string | null = 'Original description'): Promise<Chore> => {
    const result = await db.insert(choresTable)
      .values({
        name,
        description
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update chore name only', async () => {
    // Create a test chore
    const testChore = await createTestChore();
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Updated Chore Name'
    };

    const result = await updateChore(updateInput);

    // Verify the response
    expect(result.id).toEqual(testChore.id);
    expect(result.name).toEqual('Updated Chore Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update chore description only', async () => {
    // Create a test chore
    const testChore = await createTestChore();
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      description: 'Updated description'
    };

    const result = await updateChore(updateInput);

    // Verify the response
    expect(result.id).toEqual(testChore.id);
    expect(result.name).toEqual('Original Chore'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a test chore
    const testChore = await createTestChore();
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Completely New Name',
      description: 'Completely new description'
    };

    const result = await updateChore(updateInput);

    // Verify the response
    expect(result.id).toEqual(testChore.id);
    expect(result.name).toEqual('Completely New Name');
    expect(result.description).toEqual('Completely new description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a test chore with a description
    const testChore = await createTestChore('Test Chore', 'Has description');
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      description: null
    };

    const result = await updateChore(updateInput);

    // Verify the response
    expect(result.id).toEqual(testChore.id);
    expect(result.name).toEqual('Test Chore'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    // Create a test chore
    const testChore = await createTestChore();
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Database Test Name',
      description: 'Database test description'
    };

    await updateChore(updateInput);

    // Query the database directly to verify persistence
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, testChore.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Database Test Name');
    expect(chores[0].description).toEqual('Database test description');
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle chore with null description initially', async () => {
    // Create a test chore with null description
    const testChore = await createTestChore('Test Chore', null);
    
    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Updated Name',
      description: 'Now has description'
    };

    const result = await updateChore(updateInput);

    // Verify the response
    expect(result.id).toEqual(testChore.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Now has description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when chore does not exist', async () => {
    const updateInput: UpdateChoreInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateChore(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates without affecting other fields', async () => {
    // Create multiple test chores to ensure we're only updating the target one
    const testChore1 = await createTestChore('Chore 1', 'Description 1');
    const testChore2 = await createTestChore('Chore 2', 'Description 2');
    
    const updateInput: UpdateChoreInput = {
      id: testChore1.id,
      name: 'Updated Chore 1'
    };

    const result = await updateChore(updateInput);

    // Verify only the target chore was updated
    expect(result.id).toEqual(testChore1.id);
    expect(result.name).toEqual('Updated Chore 1');
    expect(result.description).toEqual('Description 1'); // Should remain unchanged

    // Verify other chore was not affected
    const otherChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, testChore2.id))
      .execute();

    expect(otherChores[0].name).toEqual('Chore 2');
    expect(otherChores[0].description).toEqual('Description 2');
  });
});
