import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore, getChores } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

// Test input for creating a chore
const testInput: CreateChoreInput = {
  name: 'Test Chore',
  description: 'A chore for testing purposes',
};

describe('createChore and getChores handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore and return correct fields', async () => {
    const result = await createChore(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.description).toBe(testInput.description);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the chore in the database', async () => {
    const created = await createChore(testInput);

    const rows = await db
      .select()
      .from(choresTable)
      .where(eq(choresTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.description).toBe(testInput.description);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('getChores should return all created chores', async () => {
    // Create two chores
    const chore1 = await createChore({ name: 'Chore 1', description: null });
    const chore2 = await createChore({ name: 'Chore 2', description: 'Second chore' });

    const allChores = await getChores();
    // Ensure both are present (order not guaranteed)
    const ids = allChores.map((c) => c.id);
    expect(ids).toContain(chore1.id);
    expect(ids).toContain(chore2.id);
  });
});
