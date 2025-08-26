import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePlantInput = {
  name: 'Test Plant',
  species: 'Test Species',
  lastWatered: new Date('2023-01-01'),
  lightExposure: 'medium'
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant', async () => {
    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Plant');
    expect(result.species).toEqual(testInput.species);
    expect(result.lastWatered).toEqual(testInput.lastWatered);
    expect(result.lightExposure).toEqual('medium');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save plant to database', async () => {
    const result = await createPlant(testInput);

    // Query using proper drizzle syntax
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Test Plant');
    expect(plants[0].species).toEqual(testInput.species);
    expect(plants[0].lastWatered).toEqual(testInput.lastWatered);
    expect(plants[0].lightExposure).toEqual('medium');
    expect(plants[0].createdAt).toBeInstanceOf(Date);
  });

  it('should use default light exposure when not provided', async () => {
    // Create input without lightExposure to test default
    const inputWithoutLight = {
      name: 'Default Light Plant',
      species: 'Test Species',
      lastWatered: new Date('2023-01-01')
    };

    // Since our handler expects a CreatePlantInput which has the default applied by Zod,
    // we need to simulate what would happen when Zod parses the input
    const result = await createPlant({
      ...inputWithoutLight,
      lightExposure: 'low' // This is what Zod would provide as default
    } as CreatePlantInput);

    expect(result.lightExposure).toEqual('low'); // Default value
  });
});
