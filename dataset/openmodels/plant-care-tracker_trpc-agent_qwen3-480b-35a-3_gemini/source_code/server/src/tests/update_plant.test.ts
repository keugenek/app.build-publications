import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Test data for creating a plant
const createInput: CreatePlantInput = {
  name: 'Test Plant',
  lastWateredDate: '2023-01-01',
  lightLevel: 'medium',
  humidity: 'high'
};

// Test data for partial update
const updateInput: UpdatePlantInput = {
  id: 1,
  name: 'Updated Plant Name',
  lightLevel: 'high'
};

describe('updatePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a plant with all fields provided', async () => {
    // First create a plant to update
    const createdPlant = await createPlant(createInput);
    
    // Update all fields
    const updateData: UpdatePlantInput = {
      id: createdPlant.id,
      name: 'Fully Updated Plant',
      lastWateredDate: '2023-02-01',
      lightLevel: 'high',
      humidity: 'low'
    };
    
    const result = await updatePlant(updateData);

    // Validate returned data
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual('Fully Updated Plant');
    expect(result.lastWateredDate).toEqual('2023-02-01');
    expect(result.lightLevel).toEqual('high');
    expect(result.humidity).toEqual('low');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a plant with partial data', async () => {
    // First create a plant to update
    const createdPlant = await createPlant(createInput);
    
    // Update only some fields
    const updateData: UpdatePlantInput = {
      id: createdPlant.id,
      name: 'Partially Updated Plant',
      lightLevel: 'low'
    };
    
    const result = await updatePlant(updateData);

    // Validate that provided fields are updated
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual('Partially Updated Plant');
    expect(result.lightLevel).toEqual('low');
    
    // Validate that non-provided fields remain unchanged
    expect(result.lastWateredDate).toEqual(createdPlant.lastWateredDate);
    expect(result.humidity).toEqual(createdPlant.humidity);
    expect(result.created_at).toEqual(createdPlant.created_at);
  });

  it('should save updated plant to database', async () => {
    // First create a plant to update
    const createdPlant = await createPlant(createInput);
    
    // Update the plant
    const updateData: UpdatePlantInput = {
      id: createdPlant.id,
      name: 'Database Updated Plant',
      humidity: 'medium'
    };
    
    await updatePlant(updateData);

    // Query the database to confirm update
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(plants).toHaveLength(1);
    const updatedPlant = plants[0];
    expect(updatedPlant.name).toEqual('Database Updated Plant');
    expect(updatedPlant.humidity).toEqual('medium');
    // Ensure unchanged fields remain the same
    expect(updatedPlant.lastWateredDate).toEqual(createdPlant.lastWateredDate);
    expect(updatedPlant.lightLevel).toEqual(createdPlant.lightLevel);
  });

  it('should throw error when updating non-existent plant', async () => {
    const updateData: UpdatePlantInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Plant'
    };

    await expect(updatePlant(updateData)).rejects.toThrow(/Plant with id 99999 not found/);
  });
});
