import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { deletePlant } from '../handlers/delete_plant';
import { eq } from 'drizzle-orm';

describe('deletePlant', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test plant to delete
    await db.insert(plantsTable).values({
      name: 'Test Plant',
      lastWateredDate: new Date().toISOString().split('T')[0],
      lightLevel: 'high',
      humidity: 'medium'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should delete a plant by ID', async () => {
    // First, get the plant we inserted
    const plants = await db.select().from(plantsTable).execute();
    expect(plants).toHaveLength(1);
    
    const plantId = plants[0].id;
    
    // Delete the plant
    await deletePlant(plantId);
    
    // Verify the plant is deleted
    const remainingPlants = await db.select().from(plantsTable).where(eq(plantsTable.id, plantId)).execute();
    expect(remainingPlants).toHaveLength(0);
  });

  it('should not throw an error when trying to delete a non-existent plant', async () => {
    // Try to delete a plant that doesn't exist
    await expect(deletePlant(99999)).resolves.toBeUndefined();
    
    // Verify other plants still exist
    const plants = await db.select().from(plantsTable).execute();
    expect(plants).toHaveLength(1); // Our test plant should still be there
  });
});
