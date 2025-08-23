import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput, type UpdateHabitInput } from '../schema';
import { eq } from 'drizzle-orm';

// Import the handler we're testing
import { updateHabit } from '../handlers/update_habit';

// Test data
const createHabitInput: CreateHabitInput = {
  name: 'Exercise',
  description: 'Daily exercise routine'
};

const updateHabitInput: UpdateHabitInput = {
  id: 1,
  name: 'Morning Exercise',
  description: 'Morning exercise routine'
};

describe('updateHabit', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a habit to update
    await db.insert(habitsTable)
      .values({
        name: createHabitInput.name,
        description: createHabitInput.description
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update an existing habit', async () => {
    const result = await updateHabit(updateHabitInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Morning Exercise');
    expect(result.description).toEqual('Morning exercise routine');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated habit to database', async () => {
    await updateHabit(updateHabitInput);

    // Query the database to verify changes were saved
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, 1))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Morning Exercise');
    expect(habits[0].description).toEqual('Morning exercise routine');
  });

  it('should partially update a habit when only some fields are provided', async () => {
    const partialUpdateInput: UpdateHabitInput = {
      id: 1,
      name: 'Updated Exercise Name'
      // description is omitted
    };

    const result = await updateHabit(partialUpdateInput);

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Exercise Name');
    // Description should remain unchanged
    expect(result.description).toEqual('Daily exercise routine');
  });

  it('should throw an error when trying to update a non-existent habit', async () => {
    const invalidUpdateInput: UpdateHabitInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent habit'
    };

    await expect(updateHabit(invalidUpdateInput))
      .rejects
      .toThrow();
  });
});
