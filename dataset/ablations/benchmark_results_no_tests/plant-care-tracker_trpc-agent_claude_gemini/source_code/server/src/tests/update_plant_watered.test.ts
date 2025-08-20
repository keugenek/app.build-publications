import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantWateredInput, type CreatePlantInput } from '../schema';
import { updatePlantWatered } from '../handlers/update_plant_watered';
import { eq } from 'drizzle-orm';

// Helper function to create a test plant
const createTestPlant = async (plantData: CreatePlantInput) => {
  const result = await db.insert(plantsTable)
    .values({
      name: plantData.name,
      last_watered: plantData.last_watered
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test input data
const originalWaterDate = new Date('2024-01-01T10:00:00Z');
const newWaterDate = new Date('2024-01-15T14:30:00Z');

const testPlantInput: CreatePlantInput = {
  name: 'Test Fern',
  last_watered: originalWaterDate
};

describe('updatePlantWatered', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update plant last watered date', async () => {
    // Create a test plant first
    const createdPlant = await createTestPlant(testPlantInput);

    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: newWaterDate
    };

    const result = await updatePlantWatered(updateInput);

    // Verify the returned plant data
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual('Test Fern');
    expect(result.last_watered).toEqual(newWaterDate);
    expect(result.created_at).toEqual(createdPlant.created_at);
  });

  it('should persist changes to database', async () => {
    // Create a test plant first
    const createdPlant = await createTestPlant(testPlantInput);

    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: newWaterDate
    };

    await updatePlantWatered(updateInput);

    // Query database directly to verify persistence
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].last_watered).toEqual(newWaterDate);
    expect(plants[0].name).toEqual('Test Fern');
    expect(plants[0].created_at).toEqual(createdPlant.created_at);
  });

  it('should throw error for non-existent plant', async () => {
    const updateInput: UpdatePlantWateredInput = {
      id: 999, // Non-existent plant ID
      last_watered: newWaterDate
    };

    await expect(updatePlantWatered(updateInput))
      .rejects.toThrow(/Plant with id 999 not found/);
  });

  it('should handle date object correctly', async () => {
    // Create a test plant first
    const createdPlant = await createTestPlant(testPlantInput);

    const specificDate = new Date('2024-02-14T09:15:30Z');
    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: specificDate
    };

    const result = await updatePlantWatered(updateInput);

    // Verify date handling
    expect(result.last_watered).toBeInstanceOf(Date);
    expect(result.last_watered.getTime()).toEqual(specificDate.getTime());
  });

  it('should not modify other plant properties', async () => {
    // Create a test plant first
    const createdPlant = await createTestPlant(testPlantInput);

    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: newWaterDate
    };

    const result = await updatePlantWatered(updateInput);

    // Verify other properties remain unchanged
    expect(result.name).toEqual(createdPlant.name);
    expect(result.created_at).toEqual(createdPlant.created_at);
    expect(result.id).toEqual(createdPlant.id);
  });

  it('should handle multiple plants independently', async () => {
    // Create two test plants
    const plant1 = await createTestPlant({
      name: 'Plant One',
      last_watered: originalWaterDate
    });

    const plant2 = await createTestPlant({
      name: 'Plant Two', 
      last_watered: originalWaterDate
    });

    // Update only the first plant
    const updateInput: UpdatePlantWateredInput = {
      id: plant1.id,
      last_watered: newWaterDate
    };

    await updatePlantWatered(updateInput);

    // Query both plants from database
    const plants = await db.select()
      .from(plantsTable)
      .execute();

    const updatedPlant1 = plants.find(p => p.id === plant1.id);
    const unchangedPlant2 = plants.find(p => p.id === plant2.id);

    // Verify first plant was updated
    expect(updatedPlant1?.last_watered).toEqual(newWaterDate);
    
    // Verify second plant was not affected
    expect(unchangedPlant2?.last_watered).toEqual(originalWaterDate);
  });
});
