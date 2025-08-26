import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePlantInput = {
  name: 'Test Plant',
  lastWateredDate: '2023-01-01',
  lightLevel: 'medium',
  humidity: 'high'
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant', async () => {
    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Plant');
    expect(result.lastWateredDate).toEqual('2023-01-01');
    expect(result.lightLevel).toEqual('medium');
    expect(result.humidity).toEqual('high');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
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
    expect(plants[0].lastWateredDate).toEqual('2023-01-01');
    expect(plants[0].lightLevel).toEqual('medium');
    expect(plants[0].humidity).toEqual('high');
    expect(plants[0].created_at).toBeInstanceOf(Date);
  });

  it('should create plants with different values', async () => {
    const testInputs: CreatePlantInput[] = [
      {
        name: 'Sunflower',
        lastWateredDate: '2023-05-15',
        lightLevel: 'high',
        humidity: 'low'
      },
      {
        name: 'Fern',
        lastWateredDate: '2023-05-10',
        lightLevel: 'low',
        humidity: 'high'
      }
    ];

    for (const input of testInputs) {
      const result = await createPlant(input);
      
      expect(result.name).toEqual(input.name);
      expect(result.lastWateredDate).toEqual(input.lastWateredDate);
      expect(result.lightLevel).toEqual(input.lightLevel);
      expect(result.humidity).toEqual(input.humidity);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    }
  });
});
