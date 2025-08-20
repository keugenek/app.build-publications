import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantWateredInput } from '../schema';
import { updatePlantWatered } from '../handlers/update_plant_watered';
import { eq } from 'drizzle-orm';

describe('updatePlantWatered', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update plant last_watered date', async () => {
    // Create a test plant first
    const plantResult = await db.insert(plantsTable)
      .values({
        name: 'Test Plant',
        last_watered: new Date('2023-01-01T12:00:00Z')
      })
      .returning()
      .execute();

    const createdPlant = plantResult[0];
    const newWateredDate = new Date('2023-12-01T15:30:00Z');

    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: newWateredDate
    };

    const result = await updatePlantWatered(updateInput);

    // Verify the returned plant data
    expect(result.id).toEqual(createdPlant.id);
    expect(result.name).toEqual('Test Plant');
    expect(result.last_watered).toEqual(newWateredDate);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdPlant.created_at);
  });

  it('should save updated last_watered date to database', async () => {
    // Create a test plant first
    const plantResult = await db.insert(plantsTable)
      .values({
        name: 'Database Test Plant',
        last_watered: new Date('2023-01-01T08:00:00Z')
      })
      .returning()
      .execute();

    const createdPlant = plantResult[0];
    const newWateredDate = new Date('2023-12-15T10:45:00Z');

    const updateInput: UpdatePlantWateredInput = {
      id: createdPlant.id,
      last_watered: newWateredDate
    };

    // Update the plant
    await updatePlantWatered(updateInput);

    // Query the database to verify the change was persisted
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Database Test Plant');
    expect(plants[0].last_watered).toEqual(newWateredDate);
    expect(plants[0].created_at).toEqual(createdPlant.created_at);
  });

  it('should throw error when plant does not exist', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdatePlantWateredInput = {
      id: nonExistentId,
      last_watered: new Date('2023-12-01T12:00:00Z')
    };

    await expect(updatePlantWatered(updateInput))
      .rejects
      .toThrow(/Plant with id 99999 not found/i);
  });

  it('should handle different date formats correctly', async () => {
    // Create a test plant
    const plantResult = await db.insert(plantsTable)
      .values({
        name: 'Date Format Test Plant',
        last_watered: new Date('2023-01-01T00:00:00Z')
      })
      .returning()
      .execute();

    const createdPlant = plantResult[0];

    // Test with various date scenarios
    const testDates = [
      new Date('2023-12-25T23:59:59Z'), // End of day
      new Date('2023-06-15T06:30:00Z'), // Early morning
      new Date(), // Current time
    ];

    for (const testDate of testDates) {
      const updateInput: UpdatePlantWateredInput = {
        id: createdPlant.id,
        last_watered: testDate
      };

      const result = await updatePlantWatered(updateInput);

      expect(result.last_watered).toEqual(testDate);
      expect(result.last_watered).toBeInstanceOf(Date);

      // Verify in database
      const dbPlant = await db.select()
        .from(plantsTable)
        .where(eq(plantsTable.id, createdPlant.id))
        .execute();

      expect(dbPlant[0].last_watered).toEqual(testDate);
    }
  });

  it('should preserve all other plant fields when updating', async () => {
    // Create a plant with specific data
    const originalPlant = await db.insert(plantsTable)
      .values({
        name: 'Preservation Test Plant',
        last_watered: new Date('2023-01-01T12:00:00Z')
      })
      .returning()
      .execute();

    const plant = originalPlant[0];
    const newWateredDate = new Date('2023-12-01T18:00:00Z');

    const updateInput: UpdatePlantWateredInput = {
      id: plant.id,
      last_watered: newWateredDate
    };

    const result = await updatePlantWatered(updateInput);

    // Verify all fields are preserved except last_watered
    expect(result.id).toEqual(plant.id);
    expect(result.name).toEqual(plant.name);
    expect(result.created_at).toEqual(plant.created_at);
    expect(result.last_watered).toEqual(newWateredDate);
    expect(result.last_watered).not.toEqual(plant.last_watered);
  });
});
