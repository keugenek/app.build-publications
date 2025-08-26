import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore with description', async () => {
    const testInput: CreateChoreInput = {
      name: 'Clean Kitchen',
      description: 'Wash dishes and wipe counters'
    };

    const result = await createChore(testInput);

    // Basic field validation
    expect(result.name).toEqual('Clean Kitchen');
    expect(result.description).toEqual('Wash dishes and wipe counters');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a chore without description', async () => {
    const testInput: CreateChoreInput = {
      name: 'Take Out Trash',
      description: null
    };

    const result = await createChore(testInput);

    // Basic field validation
    expect(result.name).toEqual('Take Out Trash');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chore to database', async () => {
    const testInput: CreateChoreInput = {
      name: 'Vacuum Living Room',
      description: 'Vacuum carpet and under furniture'
    };

    const result = await createChore(testInput);

    // Query using proper drizzle syntax
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Vacuum Living Room');
    expect(chores[0].description).toEqual('Vacuum carpet and under furniture');
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple chores independently', async () => {
    const firstChore: CreateChoreInput = {
      name: 'Clean Bathroom',
      description: 'Clean toilet, sink, and shower'
    };

    const secondChore: CreateChoreInput = {
      name: 'Mow Lawn',
      description: null
    };

    const result1 = await createChore(firstChore);
    const result2 = await createChore(secondChore);

    // Verify both chores were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Clean Bathroom');
    expect(result2.name).toEqual('Mow Lawn');
    expect(result1.description).toEqual('Clean toilet, sink, and shower');
    expect(result2.description).toBeNull();

    // Verify both are in database
    const allChores = await db.select()
      .from(choresTable)
      .execute();

    expect(allChores).toHaveLength(2);
  });

  it('should handle chores with long names and descriptions', async () => {
    const testInput: CreateChoreInput = {
      name: 'Deep Clean and Organize the Entire Kitchen Including All Appliances',
      description: 'This involves cleaning the refrigerator inside and out, organizing all cabinets and pantry items, deep cleaning the oven and stovetop, mopping floors, and sanitizing all surfaces including countertops and backsplash'
    };

    const result = await createChore(testInput);

    expect(result.name).toEqual(testInput.name);
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const savedChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(savedChore[0].name).toEqual(testInput.name);
    expect(savedChore[0].description).toEqual(testInput.description);
  });
});
