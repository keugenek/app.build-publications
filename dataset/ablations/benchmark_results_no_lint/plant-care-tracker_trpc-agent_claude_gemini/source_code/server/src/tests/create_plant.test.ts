import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a happy plant with medium sunlight', async () => {
    const testInput: CreatePlantInput = {
      name: 'Happy Fern',
      last_watered: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      sunlight_exposure: 'Medium'
    };

    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Happy Fern');
    expect(result.last_watered).toBeInstanceOf(Date);
    expect(result.sunlight_exposure).toEqual('Medium');
    expect(result.mood).toEqual('Happy');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a happy plant with high sunlight', async () => {
    const testInput: CreatePlantInput = {
      name: 'Sunny Plant',
      last_watered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      sunlight_exposure: 'High'
    };

    const result = await createPlant(testInput);

    expect(result.name).toEqual('Sunny Plant');
    expect(result.sunlight_exposure).toEqual('High');
    expect(result.mood).toEqual('Happy');
  });

  it('should create an over-watered plant', async () => {
    const testInput: CreatePlantInput = {
      name: 'Soggy Plant',
      last_watered: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      sunlight_exposure: 'High'
    };

    const result = await createPlant(testInput);

    expect(result.name).toEqual('Soggy Plant');
    expect(result.sunlight_exposure).toEqual('High');
    expect(result.mood).toEqual('Over-watered');
  });

  it('should create a thirsty plant', async () => {
    const testInput: CreatePlantInput = {
      name: 'Thirsty Cactus',
      last_watered: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      sunlight_exposure: 'High'
    };

    const result = await createPlant(testInput);

    expect(result.name).toEqual('Thirsty Cactus');
    expect(result.sunlight_exposure).toEqual('High');
    expect(result.mood).toEqual('Thirsty');
  });

  it('should create a sun-deprived plant with low sunlight', async () => {
    const testInput: CreatePlantInput = {
      name: 'Shade Plant',
      last_watered: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      sunlight_exposure: 'Low'
    };

    const result = await createPlant(testInput);

    expect(result.name).toEqual('Shade Plant');
    expect(result.sunlight_exposure).toEqual('Low');
    expect(result.mood).toEqual('Sun-deprived');
  });

  it('should save plant to database correctly', async () => {
    const testInput: CreatePlantInput = {
      name: 'Database Test Plant',
      last_watered: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      sunlight_exposure: 'Medium'
    };

    const result = await createPlant(testInput);

    // Query database to verify plant was saved
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    const savedPlant = plants[0];
    expect(savedPlant.name).toEqual('Database Test Plant');
    expect(savedPlant.sunlight_exposure).toEqual('Medium');
    expect(savedPlant.last_watered).toBeInstanceOf(Date);
    expect(savedPlant.created_at).toBeInstanceOf(Date);
  });

  it('should handle plants watered exactly 1 day ago as happy', async () => {
    const testInput: CreatePlantInput = {
      name: 'Exactly One Day Plant',
      last_watered: new Date(Date.now() - 24 * 60 * 60 * 1000), // Exactly 1 day ago
      sunlight_exposure: 'Medium'
    };

    const result = await createPlant(testInput);

    expect(result.mood).toEqual('Happy');
  });

  it('should handle plants watered exactly 2 days ago as happy', async () => {
    const testInput: CreatePlantInput = {
      name: 'Exactly Two Days Plant',
      last_watered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Exactly 2 days ago
      sunlight_exposure: 'High'
    };

    const result = await createPlant(testInput);

    expect(result.mood).toEqual('Happy');
  });

  it('should prioritize over-watered over sun-deprived', async () => {
    const testInput: CreatePlantInput = {
      name: 'Over-watered Low Light',
      last_watered: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      sunlight_exposure: 'Low'
    };

    const result = await createPlant(testInput);

    expect(result.mood).toEqual('Over-watered');
  });

  it('should prioritize thirsty over sun-deprived', async () => {
    const testInput: CreatePlantInput = {
      name: 'Thirsty Low Light',
      last_watered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      sunlight_exposure: 'Low'
    };

    const result = await createPlant(testInput);

    expect(result.mood).toEqual('Thirsty');
  });

  it('should create multiple plants with unique IDs', async () => {
    const testInput1: CreatePlantInput = {
      name: 'Plant One',
      last_watered: new Date(Date.now() - 24 * 60 * 60 * 1000),
      sunlight_exposure: 'Medium'
    };

    const testInput2: CreatePlantInput = {
      name: 'Plant Two',
      last_watered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sunlight_exposure: 'High'
    };

    const result1 = await createPlant(testInput1);
    const result2 = await createPlant(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Plant One');
    expect(result2.name).toEqual('Plant Two');
    expect(result1.mood).toEqual('Happy');
    expect(result2.mood).toEqual('Happy');
  });
});
