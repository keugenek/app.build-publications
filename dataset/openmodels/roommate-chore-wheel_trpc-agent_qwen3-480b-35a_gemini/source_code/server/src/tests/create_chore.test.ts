import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateChoreInput = {
  name: 'Test Chore',
  description: 'A chore for testing'
};

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore', async () => {
    const result = await createChore(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Chore');
    expect(result.description).toEqual('A chore for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chore to database', async () => {
    const result = await createChore(testInput);

    // Query using proper drizzle syntax
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Test Chore');
    expect(chores[0].description).toEqual('A chore for testing');
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle chore with null description', async () => {
    const inputWithNullDescription: CreateChoreInput = {
      name: 'Test Chore Without Description',
      description: null
    };

    const result = await createChore(inputWithNullDescription);

    expect(result.name).toEqual('Test Chore Without Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
