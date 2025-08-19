import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateChoreInput = {
  name: 'Take out trash'
};

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore', async () => {
    const result = await createChore(testInput);

    // Basic field validation
    expect(result.name).toEqual('Take out trash');
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
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
    expect(chores[0].name).toEqual('Take out trash');
    expect(chores[0].created_at).toBeInstanceOf(Date);
    expect(chores[0].id).toEqual(result.id);
  });

  it('should handle different chore names', async () => {
    const choreName = 'Vacuum living room';
    const input: CreateChoreInput = {
      name: choreName
    };

    const result = await createChore(input);

    expect(result.name).toEqual(choreName);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const savedChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(savedChore[0].name).toEqual(choreName);
  });

  it('should create multiple chores independently', async () => {
    const chore1 = await createChore({ name: 'Dishes' });
    const chore2 = await createChore({ name: 'Laundry' });

    // Verify different IDs
    expect(chore1.id).not.toEqual(chore2.id);
    expect(chore1.name).toEqual('Dishes');
    expect(chore2.name).toEqual('Laundry');

    // Verify both exist in database
    const allChores = await db.select()
      .from(choresTable)
      .execute();

    expect(allChores).toHaveLength(2);
    const choreNames = allChores.map(c => c.name);
    expect(choreNames).toContain('Dishes');
    expect(choreNames).toContain('Laundry');
  });

  it('should handle chores with special characters', async () => {
    const input: CreateChoreInput = {
      name: 'Clean mom\'s car & wash windows!'
    };

    const result = await createChore(input);

    expect(result.name).toEqual('Clean mom\'s car & wash windows!');
    
    // Verify special characters are saved correctly
    const savedChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(savedChore[0].name).toEqual('Clean mom\'s car & wash windows!');
  });
});
