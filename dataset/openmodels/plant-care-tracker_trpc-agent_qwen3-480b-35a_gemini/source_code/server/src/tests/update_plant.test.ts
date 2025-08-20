import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { eq } from 'drizzle-orm';

describe('updatePlant', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test plant to update
    await db.insert(plantsTable).values({
      name: 'Test Plant',
      lastWateredDate: new Date('2023-01-01'),
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update a plant name', async () => {
    const input: UpdatePlantInput = {
      id: 1,
      name: 'Updated Plant Name'
    };

    const result = await updatePlant(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Updated Plant Name');
    expect(result.lastWateredDate).toEqual(new Date('2023-01-01'));
    expect(result.mood).toBe('Thirsty'); // More than a week ago
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should update a plant last watered date', async () => {
    const input: UpdatePlantInput = {
      id: 1,
      lastWateredDate: new Date()
    };

    const result = await updatePlant(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Plant');
    expect(result.lastWateredDate).toEqual(input.lastWateredDate as Date);
    expect(result.mood).toBe('Happy'); // Watered today
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should update both name and last watered date', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 days ago
    
    const input: UpdatePlantInput = {
      id: 1,
      name: 'Fully Updated Plant',
      lastWateredDate: recentDate
    };

    const result = await updatePlant(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Fully Updated Plant');
    expect(result.lastWateredDate).toEqual(recentDate);
    expect(result.mood).toBe('Happy'); // Watered within a week
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw an error when plant is not found', async () => {
    const input: UpdatePlantInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Plant'
    };

    await expect(updatePlant(input)).rejects.toThrow(/Plant with id 999 not found/);
  });

  it('should save updated plant to database', async () => {
    const input: UpdatePlantInput = {
      id: 1,
      name: 'Database Updated Plant',
      lastWateredDate: new Date('2023-05-15')
    };

    const result = await updatePlant(input);

    // Query the database to verify the update was saved
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toBe('Database Updated Plant');
    expect(plants[0].lastWateredDate).toEqual(new Date('2023-05-15'));
    expect(plants[0].createdAt).toBeInstanceOf(Date);
  });
});
