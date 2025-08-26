import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type DeletePlantInput, type CreatePlantInput } from '../schema';
import { deletePlant } from '../handlers/delete_plant';
import { eq } from 'drizzle-orm';

// Test input for creating a plant to delete
const testPlantInput: CreatePlantInput = {
  name: 'Test Plant',
  type: 'Succulent',
  last_watered_date: new Date('2024-01-15'),
  light_exposure: 'medium'
};

describe('deletePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing plant', async () => {
    // Create a plant first
    const insertResult = await db.insert(plantsTable)
      .values({
        name: testPlantInput.name,
        type: testPlantInput.type,
        last_watered_date: testPlantInput.last_watered_date,
        light_exposure: testPlantInput.light_exposure
      })
      .returning()
      .execute();

    const createdPlant = insertResult[0];
    const deleteInput: DeletePlantInput = { id: createdPlant.id };

    // Delete the plant
    const result = await deletePlant(deleteInput);

    expect(result.success).toBe(true);
  });

  it('should remove plant from database', async () => {
    // Create a plant first
    const insertResult = await db.insert(plantsTable)
      .values({
        name: testPlantInput.name,
        type: testPlantInput.type,
        last_watered_date: testPlantInput.last_watered_date,
        light_exposure: testPlantInput.light_exposure
      })
      .returning()
      .execute();

    const createdPlant = insertResult[0];
    const deleteInput: DeletePlantInput = { id: createdPlant.id };

    // Delete the plant
    await deletePlant(deleteInput);

    // Verify plant is no longer in database
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(plants).toHaveLength(0);
  });

  it('should return success false for non-existent plant', async () => {
    const deleteInput: DeletePlantInput = { id: 999 };

    const result = await deletePlant(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other plants when deleting one', async () => {
    // Create multiple plants
    const plant1Result = await db.insert(plantsTable)
      .values({
        name: 'Plant 1',
        type: 'Succulent',
        last_watered_date: new Date('2024-01-15'),
        light_exposure: 'medium'
      })
      .returning()
      .execute();

    const plant2Result = await db.insert(plantsTable)
      .values({
        name: 'Plant 2',
        type: 'Fern',
        last_watered_date: new Date('2024-01-10'),
        light_exposure: 'low'
      })
      .returning()
      .execute();

    const plant1 = plant1Result[0];
    const plant2 = plant2Result[0];

    // Delete only the first plant
    const deleteInput: DeletePlantInput = { id: plant1.id };
    const result = await deletePlant(deleteInput);

    expect(result.success).toBe(true);

    // Verify first plant is deleted
    const deletedPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plant1.id))
      .execute();

    expect(deletedPlants).toHaveLength(0);

    // Verify second plant still exists
    const remainingPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plant2.id))
      .execute();

    expect(remainingPlants).toHaveLength(1);
    expect(remainingPlants[0].name).toBe('Plant 2');
  });

  it('should handle deletion of plant with different light exposures', async () => {
    // Create plants with different light exposures
    const lowLightResult = await db.insert(plantsTable)
      .values({
        name: 'Low Light Plant',
        type: 'Snake Plant',
        last_watered_date: new Date('2024-01-15'),
        light_exposure: 'low'
      })
      .returning()
      .execute();

    const highLightResult = await db.insert(plantsTable)
      .values({
        name: 'High Light Plant',
        type: 'Cactus',
        last_watered_date: new Date('2024-01-10'),
        light_exposure: 'high'
      })
      .returning()
      .execute();

    // Delete the low light plant
    const deleteInput: DeletePlantInput = { id: lowLightResult[0].id };
    const result = await deletePlant(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the low light plant was deleted
    const allPlants = await db.select().from(plantsTable).execute();
    expect(allPlants).toHaveLength(1);
    expect(allPlants[0].light_exposure).toBe('high');
  });
});
