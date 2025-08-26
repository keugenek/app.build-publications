import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

const testInput: CreateChoreInput = {
  title: 'Test Chore',
  description: 'A chore for testing',
};

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore and return correct fields', async () => {
    const result = await createChore(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe('Test Chore');
    expect(result.description).toBe('A chore for testing');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the chore in the database', async () => {
    const result = await createChore(testInput);
    const chores = await db
      .select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();
    expect(chores).toHaveLength(1);
    const saved = chores[0];
    expect(saved.title).toBe('Test Chore');
    expect(saved.description).toBe('A chore for testing');
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
