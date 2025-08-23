import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { eq } from 'drizzle-orm';

// Helper function to create a test plant directly in DB
const createTestPlant = async () => {
  const result = await db.insert(plantsTable)
    .values({
      name: 'Test Plant',
      species: 'Test Species',
      lastWatered: new Date('2023-01-01T10:00:00Z'),
      lightExposure: 'medium'
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updatePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a plant name', async () => {
    // First create a plant
    const createdPlant = await createTestPlant();
    
    // Update the plant name
    const updateInput: UpdatePlantInput = {
      id: createdPlant.id,
      name: 'Updated Plant Name'
    };

    const result = await updatePlant(updateInput);

    // Validate the updated fields
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual('Updated Plant Name');
    expect(result.species).toEqual(createdPlant.species);
    expect(result.lastWatered).toEqual(createdPlant.lastWatered);
    expect(result.lightExposure).toEqual(createdPlant.lightExposure);
    expect(result.createdAt).toEqual(createdPlant.createdAt);
  });

  it('should update multiple fields', async () => {
    // First create a plant
    const createdPlant = await createTestPlant();
    
    // Update multiple fields
    const updateInput: UpdatePlantInput = {
      id: createdPlant.id,
      species: 'Updated Species',
      lightExposure: 'high'
    };

    const result = await updatePlant(updateInput);

    // Validate the updated fields
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual(createdPlant.name);
    expect(result.species).toEqual('Updated Species');
    expect(result.lastWatered).toEqual(createdPlant.lastWatered);
    expect(result.lightExposure).toEqual('high');
    expect(result.createdAt).toEqual(createdPlant.createdAt);
  });

  it('should save updated plant to database', async () => {
    // First create a plant
    const createdPlant = await createTestPlant();
    
    // Update the plant
    const updateInput: UpdatePlantInput = {
      id: createdPlant.id,
      name: 'Database Updated Plant',
      lastWatered: new Date('2023-01-02T15:30:00Z')
    };

    await updatePlant(updateInput);

    // Query the database to verify the update was persisted
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Database Updated Plant');
    expect(plants[0].species).toEqual(createdPlant.species);
    expect(plants[0].lastWatered).toEqual(new Date('2023-01-02T15:30:00Z'));
    expect(plants[0].lightExposure).toEqual(createdPlant.lightExposure);
  });

  it('should throw error when updating non-existent plant', async () => {
    const updateInput: UpdatePlantInput = {
      id: 99999, // Non-existent ID
      name: 'Should Fail'
    };

    await expect(updatePlant(updateInput)).rejects.toThrow(/Plant with id 99999 not found/);
  });
});
