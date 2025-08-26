import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePlantInput = {
  name: 'Fiddle Leaf Fig',
  last_watered: new Date('2023-12-01T10:00:00Z')
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant', async () => {
    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Fiddle Leaf Fig');
    expect(result.last_watered).toBeInstanceOf(Date);
    expect(result.last_watered.toISOString()).toEqual('2023-12-01T10:00:00.000Z');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save plant to database', async () => {
    const result = await createPlant(testInput);

    // Query using proper drizzle syntax
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Fiddle Leaf Fig');
    expect(plants[0].last_watered).toBeInstanceOf(Date);
    expect(plants[0].last_watered.toISOString()).toEqual('2023-12-01T10:00:00.000Z');
    expect(plants[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle date strings as input', async () => {
    const inputWithDateString: CreatePlantInput = {
      name: 'Snake Plant',
      last_watered: new Date('2023-11-15T08:30:00Z')
    };

    const result = await createPlant(inputWithDateString);

    expect(result.name).toEqual('Snake Plant');
    expect(result.last_watered).toBeInstanceOf(Date);
    expect(result.last_watered.toISOString()).toEqual('2023-11-15T08:30:00.000Z');
  });

  it('should create multiple plants with unique IDs', async () => {
    const firstPlant = await createPlant({
      name: 'Monstera',
      last_watered: new Date('2023-12-01T09:00:00Z')
    });

    const secondPlant = await createPlant({
      name: 'Pothos',
      last_watered: new Date('2023-12-02T10:00:00Z')
    });

    expect(firstPlant.id).not.toEqual(secondPlant.id);
    expect(firstPlant.name).toEqual('Monstera');
    expect(secondPlant.name).toEqual('Pothos');

    // Verify both plants exist in database
    const allPlants = await db.select().from(plantsTable).execute();
    expect(allPlants).toHaveLength(2);
  });

  it('should set created_at automatically', async () => {
    const beforeCreation = new Date();
    const result = await createPlant(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
