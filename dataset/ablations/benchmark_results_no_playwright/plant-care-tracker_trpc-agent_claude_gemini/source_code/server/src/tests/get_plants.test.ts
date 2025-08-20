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

  it('should return all plants with happy mood when recently watered', async () => {
    // Create test plants watered within the last 3 days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(plantsTable)
      .values([
        {
          name: 'Happy Rose',
          last_watered: today,
        },
        {
          name: 'Content Cactus',
          last_watered: yesterday,
        },
        {
          name: 'Satisfied Sunflower',
          last_watered: twoDaysAgo,
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(3);
    
    // All plants should be happy (watered within 3 days)
    result.forEach(plant => {
      expect(plant.mood).toEqual('Happy');
      expect(plant.id).toBeDefined();
      expect(plant.name).toBeDefined();
      expect(plant.last_watered).toBeInstanceOf(Date);
      expect(plant.created_at).toBeInstanceOf(Date);
    });

    // Check specific plants
    const happyRose = result.find(p => p.name === 'Happy Rose');
    expect(happyRose).toBeDefined();
    expect(happyRose!.mood).toEqual('Happy');
  });

  it('should return plants with thirsty mood when not watered recently', async () => {
    // Create test plants watered more than 3 days ago
    const today = new Date();
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await db.insert(plantsTable)
      .values([
        {
          name: 'Thirsty Tulip',
          last_watered: fourDaysAgo,
        },
        {
          name: 'Parched Petunia',
          last_watered: oneWeekAgo,
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(2);
    
    // All plants should be thirsty (not watered within 3 days)
    result.forEach(plant => {
      expect(plant.mood).toEqual('Thirsty');
      expect(plant.id).toBeDefined();
      expect(plant.name).toBeDefined();
      expect(plant.last_watered).toBeInstanceOf(Date);
      expect(plant.created_at).toBeInstanceOf(Date);
    });

    const thirstyTulip = result.find(p => p.name === 'Thirsty Tulip');
    expect(thirstyTulip).toBeDefined();
    expect(thirstyTulip!.mood).toEqual('Thirsty');
  });

  it('should return mixed moods based on watering dates', async () => {
    // Create plants with different watering dates
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await db.insert(plantsTable)
      .values([
        {
          name: 'Recently Watered Plant',
          last_watered: twoDaysAgo, // Should be Happy
        },
        {
          name: 'Long Ago Watered Plant',
          last_watered: fiveDaysAgo, // Should be Thirsty
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(2);
    
    const recentPlant = result.find(p => p.name === 'Recently Watered Plant');
    expect(recentPlant).toBeDefined();
    expect(recentPlant!.mood).toEqual('Happy');
    
    const oldPlant = result.find(p => p.name === 'Long Ago Watered Plant');
    expect(oldPlant).toBeDefined();
    expect(oldPlant!.mood).toEqual('Thirsty');
  });

  it('should handle exactly 3 days ago as happy mood', async () => {
    // Test the boundary condition - exactly 3 days ago should be Happy
    const today = new Date();
    const exactlyThreeDaysAgo = new Date(today);
    exactlyThreeDaysAgo.setDate(exactlyThreeDaysAgo.getDate() - 3);

    await db.insert(plantsTable)
      .values([
        {
          name: 'Boundary Plant',
          last_watered: exactlyThreeDaysAgo,
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Boundary Plant');
    expect(result[0].mood).toEqual('Happy'); // Should still be happy at exactly 3 days
  });

  it('should return plants in database order', async () => {
    // Create multiple plants to test ordering
    const today = new Date();
    
    await db.insert(plantsTable)
      .values([
        {
          name: 'First Plant',
          last_watered: today,
        },
        {
          name: 'Second Plant', 
          last_watered: today,
        },
        {
          name: 'Third Plant',
          last_watered: today,
        }
      ])
      .execute();

    const result = await getPlants();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Plant');
    expect(result[1].name).toEqual('Second Plant');
    expect(result[2].name).toEqual('Third Plant');
    
    // All should have the same mood
    result.forEach(plant => {
      expect(plant.mood).toEqual('Happy');
    });
  });
});
