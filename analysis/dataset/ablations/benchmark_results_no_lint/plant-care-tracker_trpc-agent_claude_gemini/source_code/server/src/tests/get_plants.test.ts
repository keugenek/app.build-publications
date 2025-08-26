import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { getPlants } from '../handlers/get_plants';

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no plants exist', async () => {
    const plants = await getPlants();
    expect(plants).toEqual([]);
  });

  it('should fetch all plants with calculated moods', async () => {
    // Create test plants with various conditions
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.insert(plantsTable).values([
      {
        name: 'Happy Plant',
        last_watered: yesterday,
        sunlight_exposure: 'High'
      },
      {
        name: 'Thirsty Plant',
        last_watered: threeDaysAgo,
        sunlight_exposure: 'Medium'
      },
      {
        name: 'Sun-deprived Plant',
        last_watered: yesterday,
        sunlight_exposure: 'Low'
      }
    ]);

    const plants = await getPlants();

    expect(plants).toHaveLength(3);
    
    // Verify all required fields are present
    plants.forEach(plant => {
      expect(plant.id).toBeDefined();
      expect(plant.name).toBeDefined();
      expect(plant.last_watered).toBeInstanceOf(Date);
      expect(plant.sunlight_exposure).toBeDefined();
      expect(plant.created_at).toBeInstanceOf(Date);
      expect(plant.mood).toBeDefined();
    });
  });

  it('should calculate Happy mood correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(plantsTable).values({
      name: 'Happy Plant',
      last_watered: yesterday,
      sunlight_exposure: 'High'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Happy');
  });

  it('should calculate Thirsty mood correctly', async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    await db.insert(plantsTable).values({
      name: 'Thirsty Plant',
      last_watered: fourDaysAgo,
      sunlight_exposure: 'High'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Thirsty');
  });

  it('should calculate Sun-deprived mood correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(plantsTable).values({
      name: 'Sun-deprived Plant',
      last_watered: yesterday,
      sunlight_exposure: 'Low'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Sun-deprived');
  });

  it('should calculate Over-watered mood correctly', async () => {
    const now = new Date();

    await db.insert(plantsTable).values({
      name: 'Over-watered Plant',
      last_watered: now,
      sunlight_exposure: 'Medium'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Over-watered');
  });

  it('should handle plants with Medium sunlight exposure correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(plantsTable).values({
      name: 'Medium Sun Plant',
      last_watered: yesterday,
      sunlight_exposure: 'Medium'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Happy');
  });

  it('should prioritize Over-watered over other conditions', async () => {
    const now = new Date();

    // Plant that is both over-watered and has low sunlight
    await db.insert(plantsTable).values({
      name: 'Over-watered Low Sun Plant',
      last_watered: now,
      sunlight_exposure: 'Low'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Over-watered');
  });

  it('should prioritize Thirsty over Sun-deprived', async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    // Plant that is both thirsty and sun-deprived
    await db.insert(plantsTable).values({
      name: 'Thirsty Low Sun Plant',
      last_watered: fourDaysAgo,
      sunlight_exposure: 'Low'
    });

    const plants = await getPlants();
    expect(plants[0].mood).toEqual('Thirsty');
  });

  it('should return plants ordered by database insertion order', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(plantsTable).values([
      {
        name: 'First Plant',
        last_watered: yesterday,
        sunlight_exposure: 'High'
      },
      {
        name: 'Second Plant',
        last_watered: yesterday,
        sunlight_exposure: 'Medium'
      }
    ]);

    const plants = await getPlants();
    expect(plants[0].name).toEqual('First Plant');
    expect(plants[1].name).toEqual('Second Plant');
  });
});
