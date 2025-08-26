import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type WaterPlantInput } from '../schema';
import { waterPlant } from '../handlers/water_plant';
import { eq } from 'drizzle-orm';

describe('waterPlant', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test plant to water
    await db.insert(plantsTable).values({
      name: 'Test Plant',
      lastWateredDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      createdAt: new Date()
    }).execute();
  });
  
  afterEach(resetDB);

  it('should water a plant and update lastWateredDate', async () => {
    // Get the plant ID first
    const plants = await db.select().from(plantsTable).execute();
    const plantId = plants[0].id;
    
    const input: WaterPlantInput = {
      id: plantId
    };

    // Water the plant
    const result = await waterPlant(input);

    // Validate the returned plant data
    expect(result.id).toBe(plantId);
    expect(result.name).toBe('Test Plant');
    expect(result.lastWateredDate).toBeInstanceOf(Date);
    // Plant should be happy after watering (watered within 24 hours)
    expect(result.mood).toBe('Happy');
    expect(result.createdAt).toBeInstanceOf(Date);

    // Verify the database was updated
    const updatedPlants = await db.select().from(plantsTable).where(eq(plantsTable.id, plantId)).execute();
    expect(updatedPlants).toHaveLength(1);
    expect(updatedPlants[0].lastWateredDate).toBeInstanceOf(Date);
    // Check that the date was recently updated (within a few seconds)
    const timeDiff = Date.now() - updatedPlants[0].lastWateredDate.getTime();
    expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds old
  });

  it('should throw an error for non-existent plant', async () => {
    const input: WaterPlantInput = {
      id: 99999 // Non-existent ID
    };

    await expect(waterPlant(input)).rejects.toThrow(/Plant with id 99999 not found/);
  });
});
