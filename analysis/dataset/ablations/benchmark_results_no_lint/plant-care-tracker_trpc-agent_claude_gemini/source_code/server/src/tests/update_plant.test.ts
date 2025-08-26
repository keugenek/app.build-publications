import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { eq } from 'drizzle-orm';

describe('updatePlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test plant
  const createTestPlant = async (overrides = {}) => {
    const defaultPlant = {
      name: 'Test Plant',
      last_watered: new Date('2024-01-01'),
      sunlight_exposure: 'Medium' as const,
      ...overrides
    };

    const result = await db.insert(plantsTable)
      .values(defaultPlant)
      .returning()
      .execute();

    return result[0];
  };

  it('should update plant name successfully', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Updated Plant Name'
    };

    const result = await updatePlant(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testPlant.id);
    expect(result.name).toEqual('Updated Plant Name');
    expect(result.last_watered).toEqual(testPlant.last_watered);
    expect(result.sunlight_exposure).toEqual(testPlant.sunlight_exposure);
    expect(result.created_at).toEqual(testPlant.created_at);
    expect(result.mood).toBeDefined();
  });

  it('should update last_watered date successfully', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    const newWaterDate = new Date('2024-01-15');
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered: newWaterDate
    };

    const result = await updatePlant(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testPlant.id);
    expect(result.name).toEqual(testPlant.name);
    expect(result.last_watered).toEqual(newWaterDate);
    expect(result.sunlight_exposure).toEqual(testPlant.sunlight_exposure);
    expect(result.created_at).toEqual(testPlant.created_at);
    expect(result.mood).toBeDefined();
  });

  it('should update sunlight_exposure successfully', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      sunlight_exposure: 'High'
    };

    const result = await updatePlant(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testPlant.id);
    expect(result.name).toEqual(testPlant.name);
    expect(result.last_watered).toEqual(testPlant.last_watered);
    expect(result.sunlight_exposure).toEqual('High');
    expect(result.created_at).toEqual(testPlant.created_at);
    expect(result.mood).toBeDefined();
  });

  it('should update multiple fields simultaneously', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    const newWaterDate = new Date('2024-01-20');
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Multi-Updated Plant',
      last_watered: newWaterDate,
      sunlight_exposure: 'Low'
    };

    const result = await updatePlant(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(testPlant.id);
    expect(result.name).toEqual('Multi-Updated Plant');
    expect(result.last_watered).toEqual(newWaterDate);
    expect(result.sunlight_exposure).toEqual('Low');
    expect(result.created_at).toEqual(testPlant.created_at);
    expect(result.mood).toBeDefined();
  });

  it('should persist changes to database', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Database Test Plant'
    };

    await updatePlant(updateInput);

    // Verify changes were persisted
    const updatedPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, testPlant.id))
      .execute();

    expect(updatedPlants).toHaveLength(1);
    expect(updatedPlants[0].name).toEqual('Database Test Plant');
    expect(updatedPlants[0].last_watered).toEqual(testPlant.last_watered);
    expect(updatedPlants[0].sunlight_exposure).toEqual(testPlant.sunlight_exposure);
  });

  it('should calculate mood correctly after update', async () => {
    // Test "Happy" mood: recent watering + good sunlight
    const testPlant = await createTestPlant();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered: yesterday,
      sunlight_exposure: 'High'
    };

    const result = await updatePlant(updateInput);
    expect(result.mood).toEqual('Happy');
  });

  it('should calculate "Over-watered" mood correctly', async () => {
    // Test "Over-watered" mood: watered today
    const testPlant = await createTestPlant();
    const today = new Date();

    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered: today,
      sunlight_exposure: 'Medium'
    };

    const result = await updatePlant(updateInput);
    expect(result.mood).toEqual('Over-watered');
  });

  it('should calculate "Thirsty" mood correctly', async () => {
    // Test "Thirsty" mood: watered more than 2 days ago
    const testPlant = await createTestPlant();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered: fourDaysAgo,
      sunlight_exposure: 'High'
    };

    const result = await updatePlant(updateInput);
    expect(result.mood).toEqual('Thirsty');
  });

  it('should calculate "Sun-deprived" mood correctly', async () => {
    // Test "Sun-deprived" mood: low sunlight
    const testPlant = await createTestPlant();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      last_watered: yesterday,
      sunlight_exposure: 'Low'
    };

    const result = await updatePlant(updateInput);
    expect(result.mood).toEqual('Sun-deprived');
  });

  it('should handle partial updates without affecting other fields', async () => {
    // Create plant with specific values
    const testPlant = await createTestPlant({
      name: 'Original Plant',
      last_watered: new Date('2024-01-01'),
      sunlight_exposure: 'Medium'
    });

    // Update only the name
    const updateInput: UpdatePlantInput = {
      id: testPlant.id,
      name: 'Partially Updated Plant'
    };

    const result = await updatePlant(updateInput);

    // Verify only name changed, other fields preserved
    expect(result.name).toEqual('Partially Updated Plant');
    expect(result.last_watered).toEqual(testPlant.last_watered);
    expect(result.sunlight_exposure).toEqual(testPlant.sunlight_exposure);
    expect(result.created_at).toEqual(testPlant.created_at);
  });

  it('should throw error when plant does not exist', async () => {
    const updateInput: UpdatePlantInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Plant'
    };

    await expect(updatePlant(updateInput)).rejects.toThrow(/Plant with id 999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create test plant
    const testPlant = await createTestPlant();
    
    // Update with only ID (no actual changes)
    const updateInput: UpdatePlantInput = {
      id: testPlant.id
    };

    const result = await updatePlant(updateInput);

    // Should return existing plant data unchanged
    expect(result.id).toEqual(testPlant.id);
    expect(result.name).toEqual(testPlant.name);
    expect(result.last_watered).toEqual(testPlant.last_watered);
    expect(result.sunlight_exposure).toEqual(testPlant.sunlight_exposure);
    expect(result.created_at).toEqual(testPlant.created_at);
    expect(result.mood).toBeDefined();
  });
});
