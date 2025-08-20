import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreatePlantInput = {
  name: 'Test Plant',
  lastWateredDate: new Date('2023-01-01')
};

const testInputWithoutDate: CreatePlantInput = {
  name: 'Test Plant No Date'
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant with provided lastWateredDate', async () => {
    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Plant');
    expect(result.lastWateredDate).toEqual(new Date('2023-01-01'));
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    
    // Mood calculation validation
    expect(result.mood).toBe('Thirsty'); // More than 7 days since watering
  });

  it('should create a plant with default lastWateredDate when not provided', async () => {
    const beforeCreation = new Date();
    const result = await createPlant(testInputWithoutDate);
    const afterCreation = new Date();

    // Basic field validation
    expect(result.name).toEqual('Test Plant No Date');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    
    // Date should be within reasonable range
    expect(result.lastWateredDate.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.lastWateredDate.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    
    // Mood should be 'Happy' since it was just watered
    expect(result.mood).toBe('Happy');
  });

  it('should save plant to database', async () => {
    const result = await createPlant(testInput);

    // Query using proper drizzle syntax
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Test Plant');
    expect(plants[0].lastWateredDate).toEqual(new Date('2023-01-01'));
    expect(plants[0].createdAt).toBeInstanceOf(Date);
  });

  it('should handle plant mood calculation correctly', async () => {
    // Test case for Happy plant (watered recently)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // 1 day ago
    
    const happyPlantInput: CreatePlantInput = {
      name: 'Happy Plant',
      lastWateredDate: recentDate
    };
    
    const happyPlant = await createPlant(happyPlantInput);
    expect(happyPlant.mood).toBe('Happy');
    
    // Test case for Thirsty plant (not watered for a while)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
    
    const thirstyPlantInput: CreatePlantInput = {
      name: 'Thirsty Plant',
      lastWateredDate: oldDate
    };
    
    const thirstyPlant = await createPlant(thirstyPlantInput);
    expect(thirstyPlant.mood).toBe('Thirsty');
  });
});
