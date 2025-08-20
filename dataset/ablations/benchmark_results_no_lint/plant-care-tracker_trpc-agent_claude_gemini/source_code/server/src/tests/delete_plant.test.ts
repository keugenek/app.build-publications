import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type DeletePlantInput } from '../schema';
import { deletePlant } from '../handlers/delete_plant';
import { eq } from 'drizzle-orm';

// Test input for deletion
const testDeleteInput: DeletePlantInput = {
  id: 1
};

describe('deletePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing plant', async () => {
    // First create a plant to delete
    const insertResult = await db.insert(plantsTable)
      .values({
        name: 'Test Plant',
        last_watered: new Date('2024-01-01'),
        sunlight_exposure: 'Medium'
      })
      .returning()
      .execute();

    const plantId = insertResult[0].id;

    // Delete the plant
    const result = await deletePlant({ id: plantId });

    // Verify the response
    expect(result.success).toBe(true);
    expect(result.id).toEqual(plantId);
  });

  it('should remove plant from database', async () => {
    // First create a plant to delete
    const insertResult = await db.insert(plantsTable)
      .values({
        name: 'Test Plant to Delete',
        last_watered: new Date('2024-01-01'),
        sunlight_exposure: 'High'
      })
      .returning()
      .execute();

    const plantId = insertResult[0].id;

    // Delete the plant
    await deletePlant({ id: plantId });

    // Verify the plant is no longer in the database
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plantId))
      .execute();

    expect(plants).toHaveLength(0);
  });

  it('should throw error when plant does not exist', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent plant
    await expect(deletePlant({ id: nonExistentId }))
      .rejects
      .toThrow(/Plant with ID 99999 not found/i);
  });

  it('should not affect other plants when deleting one', async () => {
    // Create multiple plants
    const insertResult = await db.insert(plantsTable)
      .values([
        {
          name: 'Plant to Keep 1',
          last_watered: new Date('2024-01-01'),
          sunlight_exposure: 'Low'
        },
        {
          name: 'Plant to Delete',
          last_watered: new Date('2024-01-02'),
          sunlight_exposure: 'Medium'
        },
        {
          name: 'Plant to Keep 2',
          last_watered: new Date('2024-01-03'),
          sunlight_exposure: 'High'
        }
      ])
      .returning()
      .execute();

    const plantToDeleteId = insertResult[1].id;

    // Delete the middle plant
    await deletePlant({ id: plantToDeleteId });

    // Verify other plants still exist
    const remainingPlants = await db.select()
      .from(plantsTable)
      .execute();

    expect(remainingPlants).toHaveLength(2);
    expect(remainingPlants[0].name).toEqual('Plant to Keep 1');
    expect(remainingPlants[1].name).toEqual('Plant to Keep 2');

    // Verify the deleted plant is gone
    const deletedPlant = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plantToDeleteId))
      .execute();

    expect(deletedPlant).toHaveLength(0);
  });

  it('should handle edge case with ID 0', async () => {
    // Attempt to delete plant with ID 0 (which shouldn't exist)
    await expect(deletePlant({ id: 0 }))
      .rejects
      .toThrow(/Plant with ID 0 not found/i);
  });
});
