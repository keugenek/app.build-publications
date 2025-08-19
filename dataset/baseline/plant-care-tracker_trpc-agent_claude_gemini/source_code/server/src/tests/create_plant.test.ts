import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePlantInput = {
  name: 'Test Succulent',
  type: 'Jade Plant',
  last_watered_date: new Date('2024-01-15'),
  light_exposure: 'medium'
};

describe('createPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plant', async () => {
    const result = await createPlant(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Succulent');
    expect(result.type).toEqual('Jade Plant');
    expect(result.last_watered_date).toEqual(new Date('2024-01-15'));
    expect(result.light_exposure).toEqual('medium');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Should include calculated mood
    expect(result.mood).toBeDefined();
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(result.mood);
  });

  it('should save plant to database', async () => {
    const result = await createPlant(testInput);

    // Query the database to verify plant was saved
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, result.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Test Succulent');
    expect(plants[0].type).toEqual('Jade Plant');
    expect(plants[0].last_watered_date).toEqual(new Date('2024-01-15'));
    expect(plants[0].light_exposure).toEqual('medium');
    expect(plants[0].created_at).toBeInstanceOf(Date);
    expect(plants[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create plants with different light exposures', async () => {
    const lowLightInput: CreatePlantInput = {
      name: 'Snake Plant',
      type: 'Sansevieria',
      last_watered_date: new Date('2024-01-10'),
      light_exposure: 'low'
    };

    const highLightInput: CreatePlantInput = {
      name: 'Cactus',
      type: 'Barrel Cactus',
      last_watered_date: new Date('2024-01-05'),
      light_exposure: 'high'
    };

    const lowLightPlant = await createPlant(lowLightInput);
    const highLightPlant = await createPlant(highLightInput);

    expect(lowLightPlant.light_exposure).toEqual('low');
    expect(highLightPlant.light_exposure).toEqual('high');
    
    // Verify both plants have moods calculated
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(lowLightPlant.mood);
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(highLightPlant.mood);
  });

  it('should handle different watering dates correctly', async () => {
    const recentlyWateredInput: CreatePlantInput = {
      name: 'Fresh Plant',
      type: 'Fern',
      last_watered_date: new Date(), // Today
      light_exposure: 'medium'
    };

    const oldWateringInput: CreatePlantInput = {
      name: 'Old Plant',
      type: 'Ficus',
      last_watered_date: new Date('2024-01-01'), // Long time ago
      light_exposure: 'medium'
    };

    const freshPlant = await createPlant(recentlyWateredInput);
    const oldPlant = await createPlant(oldWateringInput);

    // Verify dates are preserved correctly
    expect(freshPlant.last_watered_date).toBeInstanceOf(Date);
    expect(oldPlant.last_watered_date).toEqual(new Date('2024-01-01'));
    
    // Both should have valid moods
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(freshPlant.mood);
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(oldPlant.mood);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createPlant(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Timestamps should be within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
  });
});
