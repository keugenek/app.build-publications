import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreInput, type CreateChoreInput } from '../schema';
import { updateChore } from '../handlers/update_chore';
import { eq } from 'drizzle-orm';

// Helper function to create a test chore
const createTestChore = async (input: CreateChoreInput) => {
  const result = await db.insert(choresTable)
    .values({
      name: input.name
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update chore name', async () => {
    // Create test chore
    const testChore = await createTestChore({ name: 'Original Chore' });

    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Updated Chore Name'
    };

    const result = await updateChore(updateInput);

    // Verify return value
    expect(result.id).toBe(testChore.id);
    expect(result.name).toBe('Updated Chore Name');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testChore.created_at);
  });

  it('should save updated chore to database', async () => {
    // Create test chore
    const testChore = await createTestChore({ name: 'Original Chore' });

    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Database Updated Chore'
    };

    await updateChore(updateInput);

    // Query database to verify update
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, testChore.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toBe('Database Updated Chore');
    expect(chores[0].created_at).toEqual(testChore.created_at);
  });

  it('should return existing chore when no fields provided for update', async () => {
    // Create test chore
    const testChore = await createTestChore({ name: 'Unchanged Chore' });

    const updateInput: UpdateChoreInput = {
      id: testChore.id
      // No name field provided
    };

    const result = await updateChore(updateInput);

    // Should return original chore unchanged
    expect(result.id).toBe(testChore.id);
    expect(result.name).toBe('Unchanged Chore');
    expect(result.created_at).toEqual(testChore.created_at);

    // Verify database wasn't changed
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, testChore.id))
      .execute();

    expect(chores[0].name).toBe('Unchanged Chore');
  });

  it('should handle updating chore with empty name when undefined provided', async () => {
    // Create test chore
    const testChore = await createTestChore({ name: 'Original Chore' });

    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: undefined // Explicitly undefined
    };

    const result = await updateChore(updateInput);

    // Should return original chore unchanged since name is undefined
    expect(result.id).toBe(testChore.id);
    expect(result.name).toBe('Original Chore');
    expect(result.created_at).toEqual(testChore.created_at);
  });

  it('should throw error when chore does not exist', async () => {
    const updateInput: UpdateChoreInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateChore(updateInput)).rejects.toThrow(/chore with id 99999 not found/i);
  });

  it('should handle multiple chores and update only the specified one', async () => {
    // Create multiple test chores
    const chore1 = await createTestChore({ name: 'Chore 1' });
    const chore2 = await createTestChore({ name: 'Chore 2' });
    const chore3 = await createTestChore({ name: 'Chore 3' });

    const updateInput: UpdateChoreInput = {
      id: chore2.id,
      name: 'Updated Chore 2'
    };

    const result = await updateChore(updateInput);

    // Verify correct chore was updated
    expect(result.id).toBe(chore2.id);
    expect(result.name).toBe('Updated Chore 2');

    // Verify other chores remain unchanged
    const allChores = await db.select()
      .from(choresTable)
      .execute();

    const chore1Updated = allChores.find(c => c.id === chore1.id);
    const chore3Updated = allChores.find(c => c.id === chore3.id);

    expect(chore1Updated?.name).toBe('Chore 1');
    expect(chore3Updated?.name).toBe('Chore 3');
  });

  it('should preserve original created_at timestamp', async () => {
    // Create test chore
    const testChore = await createTestChore({ name: 'Original Chore' });
    const originalCreatedAt = testChore.created_at;

    // Wait a small amount to ensure timestamp would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateChoreInput = {
      id: testChore.id,
      name: 'Updated Chore'
    };

    const result = await updateChore(updateInput);

    // created_at should remain unchanged
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
