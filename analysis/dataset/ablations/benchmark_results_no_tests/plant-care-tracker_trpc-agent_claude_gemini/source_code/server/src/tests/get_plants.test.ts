import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { getPlants } from '../handlers/get_plants';

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no plants exist', async () => {
    const result = await getPlants();
    
    expect(result).toEqual([]);
  });

  it('should return plants with Happy mood when watered within 3 days', async () => {
    // Create a plant watered today
    const today = new Date();
    await db.insert(plantsTable)
      .values({
        name: 'Happy Fern',
        last_watered: today
      })
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Happy Fern');
    expect(result[0].mood).toEqual('Happy');
    expect(result[0].last_watered).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return plants with Thirsty mood when watered more than 3 days ago', async () => {
    // Create a plant watered 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    await db.insert(plantsTable)
      .values({
        name: 'Thirsty Cactus',
        last_watered: fiveDaysAgo
      })
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Thirsty Cactus');
    expect(result[0].mood).toEqual('Thirsty');
    expect(result[0].last_watered).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return plants with Happy mood when watered exactly 3 days ago', async () => {
    // Create a plant watered exactly 3 days ago
    const exactlyThreeDaysAgo = new Date();
    exactlyThreeDaysAgo.setDate(exactlyThreeDaysAgo.getDate() - 3);
    
    await db.insert(plantsTable)
      .values({
        name: 'Border Plant',
        last_watered: exactlyThreeDaysAgo
      })
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Border Plant');
    expect(result[0].mood).toEqual('Happy');
  });

  it('should return multiple plants with correct moods', async () => {
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(today.getDate() - 5);

    // Create multiple plants with different watering dates
    await db.insert(plantsTable)
      .values([
        {
          name: 'Happy Plant 1',
          last_watered: today
        },
        {
          name: 'Happy Plant 2', 
          last_watered: twoDaysAgo
        },
        {
          name: 'Thirsty Plant',
          last_watered: fiveDaysAgo
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(3);
    
    // Find plants by name and verify moods
    const happyPlant1 = result.find(p => p.name === 'Happy Plant 1');
    const happyPlant2 = result.find(p => p.name === 'Happy Plant 2');
    const thirstyPlant = result.find(p => p.name === 'Thirsty Plant');

    expect(happyPlant1?.mood).toEqual('Happy');
    expect(happyPlant2?.mood).toEqual('Happy');
    expect(thirstyPlant?.mood).toEqual('Thirsty');

    // Verify all plants have required fields
    result.forEach(plant => {
      expect(plant.id).toBeDefined();
      expect(plant.name).toBeDefined();
      expect(plant.last_watered).toBeInstanceOf(Date);
      expect(plant.created_at).toBeInstanceOf(Date);
      expect(['Happy', 'Thirsty']).toContain(plant.mood);
    });
  });

  it('should handle plants watered in the future', async () => {
    // Edge case: plant watered in the future (should be Happy)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(plantsTable)
      .values({
        name: 'Future Plant',
        last_watered: tomorrow
      })
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Future Plant');
    expect(result[0].mood).toEqual('Happy');
  });
});
