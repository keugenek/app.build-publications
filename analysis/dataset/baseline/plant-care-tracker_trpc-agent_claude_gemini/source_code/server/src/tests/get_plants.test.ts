import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { getPlants } from '../handlers/get_plants';

// Test plant data
const testPlant1: CreatePlantInput = {
  name: 'Monstera Deliciosa',
  type: 'Tropical',
  last_watered_date: new Date('2024-01-10'),
  light_exposure: 'medium'
};

const testPlant2: CreatePlantInput = {
  name: 'Snake Plant',
  type: 'Succulent',
  last_watered_date: new Date('2024-01-01'),
  light_exposure: 'low'
};

const testPlant3: CreatePlantInput = {
  name: 'Fiddle Leaf Fig',
  type: 'Tree',
  last_watered_date: new Date(),
  light_exposure: 'high'
};

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no plants exist', async () => {
    const result = await getPlants();
    
    expect(result).toEqual([]);
  });

  it('should return all plants with calculated moods', async () => {
    // Create test plants
    await db.insert(plantsTable)
      .values([
        testPlant1,
        testPlant2,
        testPlant3
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(3);
    
    // Check that all plants have required fields
    result.forEach(plant => {
      expect(plant.id).toBeDefined();
      expect(plant.name).toBeDefined();
      expect(plant.type).toBeDefined();
      expect(plant.last_watered_date).toBeInstanceOf(Date);
      expect(plant.light_exposure).toBeDefined();
      expect(plant.created_at).toBeInstanceOf(Date);
      expect(plant.updated_at).toBeInstanceOf(Date);
      expect(plant.mood).toBeDefined();
    });

    // Check specific plant data
    const monstera = result.find(p => p.name === 'Monstera Deliciosa');
    expect(monstera).toBeDefined();
    expect(monstera!.type).toEqual('Tropical');
    expect(monstera!.light_exposure).toEqual('medium');
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(monstera!.mood);

    const snakePlant = result.find(p => p.name === 'Snake Plant');
    expect(snakePlant).toBeDefined();
    expect(snakePlant!.type).toEqual('Succulent');
    expect(snakePlant!.light_exposure).toEqual('low');
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(snakePlant!.mood);
  });

  it('should return plants ordered by database insertion', async () => {
    // Insert plants in specific order
    const plant1 = await db.insert(plantsTable)
      .values(testPlant1)
      .returning()
      .execute();
      
    const plant2 = await db.insert(plantsTable)
      .values(testPlant2)
      .returning()
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Monstera Deliciosa');
    expect(result[1].name).toEqual('Snake Plant');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should include mood calculation for recently watered plants', async () => {
    // Create a plant watered today
    const recentlyWateredPlant: CreatePlantInput = {
      name: 'Happy Plant',
      type: 'Indoor',
      last_watered_date: new Date(), // Today
      light_exposure: 'medium'
    };

    await db.insert(plantsTable)
      .values(recentlyWateredPlant)
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Happy Plant');
    expect(result[0].mood).toBeDefined();
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(result[0].mood);
  });

  it('should include mood calculation for old watered plants', async () => {
    // Create a plant watered long ago
    const oldWateredPlant: CreatePlantInput = {
      name: 'Thirsty Plant',
      type: 'Indoor',
      last_watered_date: new Date('2023-01-01'), // Very old
      light_exposure: 'high'
    };

    await db.insert(plantsTable)
      .values(oldWateredPlant)
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Thirsty Plant');
    expect(result[0].mood).toBeDefined();
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(result[0].mood);
  });

  it('should handle different light exposure levels', async () => {
    // Create plants with different light exposures
    const lowLightPlant: CreatePlantInput = {
      name: 'Low Light Plant',
      type: 'Shade',
      last_watered_date: new Date(),
      light_exposure: 'low'
    };

    const highLightPlant: CreatePlantInput = {
      name: 'High Light Plant', 
      type: 'Sun',
      last_watered_date: new Date(),
      light_exposure: 'high'
    };

    await db.insert(plantsTable)
      .values([lowLightPlant, highLightPlant])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(2);
    
    const lowLight = result.find(p => p.name === 'Low Light Plant');
    const highLight = result.find(p => p.name === 'High Light Plant');
    
    expect(lowLight).toBeDefined();
    expect(highLight).toBeDefined();
    expect(lowLight!.light_exposure).toEqual('low');
    expect(highLight!.light_exposure).toEqual('high');
    expect(lowLight!.mood).toBeDefined();
    expect(highLight!.mood).toBeDefined();
  });
});
