import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { eq } from 'drizzle-orm';

// Helper function to create a test plant
const createTestPlant = async () => {
  const result = await db.insert(plantsTable)
    .values({
      name: 'Original Rose',
      type: 'Flower',
      last_watered_date: new Date('2023-01-01'),
      light_exposure: 'medium'
    })
    .returning()
    .execute();
  return result[0];
};

describe('updatePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all plant fields', async () => {
    const testPlant = await createTestPlant();
    const newWaterDate = new Date('2023-12-01');
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Updated Rose',
      type: 'Updated Flower',
      last_watered_date: newWaterDate,
      light_exposure: 'high'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testPlant.id);
    expect(result!.name).toEqual('Updated Rose');
    expect(result!.type).toEqual('Updated Flower');
    expect(result!.last_watered_date).toEqual(newWaterDate);
    expect(result!.light_exposure).toEqual('high');
    expect(result!.mood).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toEqual(testPlant.created_at);
  });

  it('should update only specified fields', async () => {
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Partially Updated Rose'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partially Updated Rose');
    expect(result!.type).toEqual('Flower'); // Should remain unchanged
    expect(result!.last_watered_date).toEqual(testPlant.last_watered_date); // Should remain unchanged
    expect(result!.light_exposure).toEqual('medium'); // Should remain unchanged
    expect(result!.mood).toBeDefined();
  });

  it('should update last_watered_date only', async () => {
    const testPlant = await createTestPlant();
    const newWaterDate = new Date();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered_date: newWaterDate
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Rose'); // Should remain unchanged
    expect(result!.type).toEqual('Flower'); // Should remain unchanged
    expect(result!.last_watered_date).toEqual(newWaterDate);
    expect(result!.light_exposure).toEqual('medium'); // Should remain unchanged
    expect(result!.mood).toBeDefined();
  });

  it('should update light_exposure only', async () => {
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      light_exposure: 'low'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Rose'); // Should remain unchanged
    expect(result!.type).toEqual('Flower'); // Should remain unchanged
    expect(result!.last_watered_date).toEqual(testPlant.last_watered_date); // Should remain unchanged
    expect(result!.light_exposure).toEqual('low');
    expect(result!.mood).toBeDefined();
  });

  it('should return null when plant does not exist', async () => {
    const updateInput: UpdatePlantInput = {
      id: 999, // Non-existent ID
      name: 'Updated Plant'
    };

    const result = await updatePlant(updateInput);

    expect(result).toBeNull();
  });

  it('should calculate mood correctly for happy plant', async () => {
    const testPlant = await createTestPlant();
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 days ago
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered_date: recentDate,
      light_exposure: 'high'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.mood).toEqual('Happy');
  });

  it('should calculate mood correctly for thirsty plant', async () => {
    const testPlant = await createTestPlant();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered_date: oldDate,
      light_exposure: 'medium'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.mood).toEqual('Thirsty');
  });

  it('should calculate mood correctly for plant that needs sun', async () => {
    const testPlant = await createTestPlant();
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered_date: recentDate,
      light_exposure: 'low'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.mood).toEqual('Needs Sun');
  });

  it('should calculate mood correctly for wilting plant', async () => {
    const testPlant = await createTestPlant();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 15); // 15 days ago
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered_date: oldDate,
      light_exposure: 'low'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.mood).toEqual('Wilting');
  });

  it('should update the updated_at timestamp', async () => {
    const testPlant = await createTestPlant();
    const originalUpdatedAt = testPlant.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Updated Name'
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes to database', async () => {
    const testPlant = await createTestPlant();
    const newWaterDate = new Date('2023-11-15');
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Database Test Rose',
      last_watered_date: newWaterDate,
      light_exposure: 'low'
    };

    await updatePlant(updateInput);

    // Verify changes were persisted to database
    const plants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, testPlant.id))
      .execute();

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toEqual('Database Test Rose');
    expect(plants[0].last_watered_date).toEqual(newWaterDate);
    expect(plants[0].light_exposure).toEqual('low');
    expect(plants[0].type).toEqual('Flower'); // Should remain unchanged
  });

  it('should handle empty update gracefully', async () => {
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id
      // No fields to update
    };

    const result = await updatePlant(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Rose'); // All fields should remain unchanged
    expect(result!.type).toEqual('Flower');
    expect(result!.last_watered_date).toEqual(testPlant.last_watered_date);
    expect(result!.light_exposure).toEqual('medium');
    expect(result!.mood).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
