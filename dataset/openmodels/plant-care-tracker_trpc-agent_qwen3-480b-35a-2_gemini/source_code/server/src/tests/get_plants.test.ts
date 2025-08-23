import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { getPlants } from '../handlers/get_plants';
import { type CreatePlantInput } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to create a test plant
const createTestPlant = async (input: Partial<CreatePlantInput> = {}): Promise<number> => {
  const result = await db.insert(plantsTable)
    .values({
      name: input.name || 'Test Plant',
      species: input.species || 'Test Species',
      lastWatered: input.lastWatered || new Date(),
      lightExposure: input.lightExposure || 'low'
    })
    .returning({ id: plantsTable.id })
    .execute();
  
  return result[0].id;
};

// Helper function to get a plant by ID
type Plant = typeof plantsTable.$inferSelect;
const getPlantById = async (id: number): Promise<Plant> => {
  const result = await db.select()
    .from(plantsTable)
    .where(eq(plantsTable.id, id))
    .execute();
  
  return result[0];
};

// Helper to create a date in the past
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Helper to create a date in the future
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Test inputs
const happyPlantInput: Partial<CreatePlantInput> = {
  name: 'Happy Plant',
  species: 'Happyus Plantae',
  lastWatered: daysAgo(1), // Watered 1 day ago
  lightExposure: 'low'
};

const okayPlantInput: Partial<CreatePlantInput> = {
  name: 'Okay Plant',
  species: 'Okayus Plantae',
  lastWatered: daysAgo(5), // Watered 5 days ago
  lightExposure: 'low'
};

const thirstyPlantInput: Partial<CreatePlantInput> = {
  name: 'Thirsty Plant',
  species: 'Thirstius Plantae',
  lastWatered: daysAgo(5), // Watered 5 days ago
  lightExposure: 'high'
};

const sadPlantInput: Partial<CreatePlantInput> = {
  name: 'Sad Plant',
  species: 'Sadus Plantae',
  lastWatered: daysAgo(10), // Watered 10 days ago
  lightExposure: 'low'
};

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no plants exist', async () => {
    const result = await getPlants();
    expect(result).toEqual([]);
  });

  it('should return all plants with correct mood calculation for happy plant', async () => {
    // Create a happy plant (watered recently)
    await createTestPlant(happyPlantInput);
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Happy Plant');
    expect(result[0].species).toEqual('Happyus Plantae');
    expect(result[0].mood).toEqual('happy');
    expect(result[0].lightExposure).toEqual('low');
    expect(result[0].id).toBeDefined();
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('should return all plants with correct mood calculation for okay plant', async () => {
    // Create an okay plant (watered a few days ago)
    await createTestPlant(okayPlantInput);
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Okay Plant');
    expect(result[0].species).toEqual('Okayus Plantae');
    expect(result[0].mood).toEqual('okay');
  });

  it('should return all plants with correct mood calculation for thirsty plant', async () => {
    // Create a thirsty plant (watered a few days ago but high light exposure)
    await createTestPlant(thirstyPlantInput);
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Thirsty Plant');
    expect(result[0].species).toEqual('Thirstius Plantae');
    expect(result[0].mood).toEqual('thirsty');
  });

  it('should return all plants with correct mood calculation for sad plant', async () => {
    // Create a sad plant (not watered for a long time)
    await createTestPlant(sadPlantInput);
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Sad Plant');
    expect(result[0].species).toEqual('Sadus Plantae');
    expect(result[0].mood).toEqual('sad');
  });

  it('should return all plants with their properties correctly mapped', async () => {
    // Create multiple plants
    await createTestPlant(happyPlantInput);
    await createTestPlant(sadPlantInput);
    
    const result = await getPlants();
    
    expect(result).toHaveLength(2);
    
    // Check that all properties are correctly mapped
    const happyPlant = result.find(p => p.name === 'Happy Plant');
    const sadPlant = result.find(p => p.name === 'Sad Plant');
    
    expect(happyPlant).toBeDefined();
    expect(sadPlant).toBeDefined();
    
    if (happyPlant) {
      expect(happyPlant.name).toEqual('Happy Plant');
      expect(happyPlant.species).toEqual('Happyus Plantae');
      expect(happyPlant.mood).toEqual('happy');
      expect(happyPlant.lightExposure).toEqual('low');
      expect(happyPlant.id).toBeDefined();
      expect(happyPlant.createdAt).toBeInstanceOf(Date);
      expect(happyPlant.lastWatered).toBeInstanceOf(Date);
    }
    
    if (sadPlant) {
      expect(sadPlant.name).toEqual('Sad Plant');
      expect(sadPlant.species).toEqual('Sadus Plantae');
      expect(sadPlant.mood).toEqual('sad');
      expect(sadPlant.lightExposure).toEqual('low');
      expect(sadPlant.id).toBeDefined();
      expect(sadPlant.createdAt).toBeInstanceOf(Date);
      expect(sadPlant.lastWatered).toBeInstanceOf(Date);
    }
  });

  it('should handle plants with high light exposure correctly', async () => {
    // Create a plant watered 5 days ago with high light exposure
    await createTestPlant({
      name: 'High Light Plant',
      species: 'Lightus Highus',
      lastWatered: daysAgo(5),
      lightExposure: 'high'
    });
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('High Light Plant');
    expect(result[0].mood).toEqual('thirsty'); // High light plants get thirsty faster
  });

  it('should handle plants with medium light exposure correctly', async () => {
    // Create a plant watered 5 days ago with medium light exposure
    await createTestPlant({
      name: 'Medium Light Plant',
      species: 'Lightus Mediumus',
      lastWatered: daysAgo(5),
      lightExposure: 'medium'
    });
    
    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Medium Light Plant');
    expect(result[0].mood).toEqual('okay'); // Medium light plants behave normally
  });
});
