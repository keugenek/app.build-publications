import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputWithDescription: CreateChoreInput = {
  name: 'Test Chore',
  description: 'A chore for testing purposes'
};

// Test input without optional description
const testInputWithoutDescription: CreateChoreInput = {
  name: 'Simple Chore'
};

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore with description', async () => {
    const result = await createChore(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Chore');
    expect(result.description).toEqual('A chore for testing purposes');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a chore without description', async () => {
    const result = await createChore(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Simple Chore');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chore to database with description', async () => {
    const result = await createChore(testInputWithDescription);

    // Query using proper drizzle syntax
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Test Chore');
    expect(chores[0].description).toEqual('A chore for testing purposes');
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should save chore to database without description', async () => {
    const result = await createChore(testInputWithoutDescription);

    // Query using proper drizzle syntax
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Simple Chore');
    expect(chores[0].description).toBeNull();
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple chores', async () => {
    const chore1 = await createChore({ name: 'Chore 1' });
    const chore2 = await createChore({ name: 'Chore 2' });

    expect(chore1.id).not.toEqual(chore2.id);
    expect(chore1.name).toEqual('Chore 1');
    expect(chore2.name).toEqual('Chore 2');

    // Verify both exist in database
    const allChores = await db.select()
      .from(choresTable)
      .execute();

    expect(allChores).toHaveLength(2);
    const choreIds = allChores.map(chore => chore.id);
    expect(choreIds).toContain(chore1.id);
    expect(choreIds).toContain(chore2.id);
  });

  it('should handle empty description properly', async () => {
    const inputWithEmptyDescription: CreateChoreInput = {
      name: 'Empty Description Chore',
      description: ''
    };

    const result = await createChore(inputWithEmptyDescription);

    expect(result.name).toEqual('Empty Description Chore');
    expect(result.description).toBeNull(); // Empty string is converted to null
    expect(result.id).toBeDefined();

    // Verify in database
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores[0].description).toBeNull(); // Empty string is converted to null
  });

  it('should preserve exact input name and description', async () => {
    const specialInput: CreateChoreInput = {
      name: '   Chore with spaces   ',
      description: 'Description with\nnewlines and\ttabs'
    };

    const result = await createChore(specialInput);

    expect(result.name).toEqual('   Chore with spaces   ');
    expect(result.description).toEqual('Description with\nnewlines and\ttabs');

    // Verify exact preservation in database
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores[0].name).toEqual('   Chore with spaces   ');
    expect(chores[0].description).toEqual('Description with\nnewlines and\ttabs');
  });
});
