import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { getPlants } from '../handlers/get_plants';
import { sql } from 'drizzle-orm';

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no plants exist', async () => {
    const result = await getPlants();
    expect(result).toEqual([]);
  });

  it('should return plants with correct mood calculation - Thirsty Leaf', async () => {
    // Create a plant that was watered 8 days ago (more than 7 days)
    const date8DaysAgo = new Date();
    date8DaysAgo.setDate(date8DaysAgo.getDate() - 8);
    
    await db.insert(plantsTable).values({
      name: 'Test Plant 1',
      lastWateredDate: date8DaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
      lightLevel: 'high',
      humidity: 'medium'
    });

    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Plant 1');
    expect(result[0].mood).toEqual('Thirsty Leaf');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return plants with correct mood calculation - Overwatered and Sad', async () => {
    // Create a plant with low light that was watered 2 days ago (less than 3 days)
    const date2DaysAgo = new Date();
    date2DaysAgo.setDate(date2DaysAgo.getDate() - 2);
    
    await db.insert(plantsTable).values({
      name: 'Test Plant 2',
      lastWateredDate: date2DaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
      lightLevel: 'low',
      humidity: 'high'
    });

    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Plant 2');
    expect(result[0].mood).toEqual('Overwatered and Sad');
  });

  it('should return plants with correct mood calculation - Happy Sprout (default)', async () => {
    // Create a plant that was watered 5 days ago (between 3-7 days)
    const date5DaysAgo = new Date();
    date5DaysAgo.setDate(date5DaysAgo.getDate() - 5);
    
    await db.insert(plantsTable).values({
      name: 'Test Plant 3',
      lastWateredDate: date5DaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
      lightLevel: 'medium',
      humidity: 'low'
    });

    const result = await getPlants();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Plant 3');
    expect(result[0].mood).toEqual('Happy Sprout');
  });

  it('should handle multiple plants with different moods', async () => {
    // Create multiple plants with different conditions
    
    // Plant 1: Thirsty Leaf (watered 10 days ago)
    const date10DaysAgo = new Date();
    date10DaysAgo.setDate(date10DaysAgo.getDate() - 10);
    
    // Plant 2: Overwatered and Sad (low light, watered 1 day ago)
    const date1DayAgo = new Date();
    date1DayAgo.setDate(date1DayAgo.getDate() - 1);
    
    // Plant 3: Happy Sprout (watered 4 days ago)
    const date4DaysAgo = new Date();
    date4DaysAgo.setDate(date4DaysAgo.getDate() - 4);
    
    await db.insert(plantsTable).values([
      {
        name: 'Thirsty Plant',
        lastWateredDate: date10DaysAgo.toISOString().split('T')[0],
        lightLevel: 'high',
        humidity: 'medium'
      },
      {
        name: 'Overwatered Plant',
        lastWateredDate: date1DayAgo.toISOString().split('T')[0],
        lightLevel: 'low',
        humidity: 'high'
      },
      {
        name: 'Happy Plant',
        lastWateredDate: date4DaysAgo.toISOString().split('T')[0],
        lightLevel: 'medium',
        humidity: 'low'
      }
    ]);

    const result = await getPlants();
    
    expect(result).toHaveLength(3);
    
    const thirstyPlant = result.find(p => p.name === 'Thirsty Plant');
    const overwateredPlant = result.find(p => p.name === 'Overwatered Plant');
    const happyPlant = result.find(p => p.name === 'Happy Plant');
    
    expect(thirstyPlant).toBeDefined();
    expect(thirstyPlant!.mood).toEqual('Thirsty Leaf');
    
    expect(overwateredPlant).toBeDefined();
    expect(overwateredPlant!.mood).toEqual('Overwatered and Sad');
    
    expect(happyPlant).toBeDefined();
    expect(happyPlant!.mood).toEqual('Happy Sprout');
  });
});
