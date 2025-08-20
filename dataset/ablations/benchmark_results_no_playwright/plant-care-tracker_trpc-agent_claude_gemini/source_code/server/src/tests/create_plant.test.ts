import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithWatered: CreatePlantInput = {
  name: 'Test Rose',
  last_watered: new Date('2024-01-15T10:00:00Z')
};

const testInputWithoutWatered: CreatePlantInput = {
  name: 'Test Tulip'
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant with provided last_watered date', async () => {
    const result = await createPlant(testInputWithWatered);

    // Basic field validation
    expect(result.name).toEqual('Test Rose');
    expect(result.last_watered).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a plant with current date when last_watered is not provided', async () => {
    const beforeCreate = new Date();
    const result = await createPlant(testInputWithoutWatered);
    const afterCreate = new Date();

    // Basic field validation
    expect(result.name).toEqual('Test Tulip');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_watered).toBeInstanceOf(Date);
    
    // Verify last_watered defaulted to current time (within reasonable range)
    expect(result.last_watered >= beforeCreate).toBe(true);
    expect(result.last_watered <= afterCreate).toBe(true);
  });

  it('should save plant to database with provided last_watered', async () => {
    const result = await createPlant(testInputWithWatered);

    // Query database to verify persistence
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Test Rose');
    expect(plants[0].last_watered).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(plants[0].created_at).toBeInstanceOf(Date);
  });

  it('should save plant to database with default last_watered', async () => {
    const beforeCreate = new Date();
    const result = await createPlant(testInputWithoutWatered);
    const afterCreate = new Date();

    // Query database to verify persistence
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Test Tulip');
    expect(plants[0].last_watered).toBeInstanceOf(Date);
    expect(plants[0].created_at).toBeInstanceOf(Date);
    
    // Verify the stored last_watered date is within expected range
    expect(plants[0].last_watered >= beforeCreate).toBe(true);
    expect(plants[0].last_watered <= afterCreate).toBe(true);
  });

  it('should handle multiple plants creation correctly', async () => {
    // Create first plant
    const plant1 = await createPlant({
      name: 'Sunflower',
      last_watered: new Date('2024-01-10T09:00:00Z')
    });

    // Create second plant
    const plant2 = await createPlant({
      name: 'Daisy'
    });

    // Verify both plants have unique IDs
    expect(plant1.id).not.toEqual(plant2.id);
    
    // Verify both plants exist in database
    const allPlants = await db.select()
      .from(plantsTable)
      .execute();

    expect(allPlants).toHaveLength(2);
    
    const plantNames = allPlants.map(p => p.name).sort();
    expect(plantNames).toEqual(['Daisy', 'Sunflower']);
  });
});
