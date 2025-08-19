import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type GetPlantInput, type CreatePlantInput } from '../schema';
import { getPlant } from '../handlers/get_plant';
import { eq } from 'drizzle-orm';

// Test data setup
const createTestPlant = async (overrides: Partial<CreatePlantInput> = {}) => {
  const plantData = {
    name: 'Test Fern',
    type: 'Boston Fern',
    last_watered_date: new Date(),
    light_exposure: 'medium' as const,
    ...overrides
  };

  const result = await db.insert(plantsTable)
    .values(plantData)
    .returning()
    .execute();

  return result[0];
};

describe('getPlant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a plant with mood when found', async () => {
    // Create a test plant
    const createdPlant = await createTestPlant({
      name: 'Happy Plant',
      type: 'Pothos',
      last_watered_date: new Date(), // Recently watered
      light_exposure: 'high'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    // Verify the plant is returned with all expected fields
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdPlant.id);
    expect(result!.name).toEqual('Happy Plant');
    expect(result!.type).toEqual('Pothos');
    expect(result!.light_exposure).toEqual('high');
    expect(result!.last_watered_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify mood is calculated and included
    expect(result!.mood).toBeDefined();
    expect(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']).toContain(result!.mood);
  });

  it('should return null when plant is not found', async () => {
    const input: GetPlantInput = {
      id: 9999 // Non-existent ID
    };

    const result = await getPlant(input);

    expect(result).toBeNull();
  });

  it('should return plant with Happy mood when recently watered with good light', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

    const createdPlant = await createTestPlant({
      name: 'Happy Plant',
      last_watered_date: recentDate,
      light_exposure: 'high'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    expect(result).toBeDefined();
    expect(result!.mood).toEqual('Happy');
  });

  it('should return plant with Thirsty mood when not watered recently but has good light', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    const createdPlant = await createTestPlant({
      name: 'Thirsty Plant',
      last_watered_date: oldDate,
      light_exposure: 'medium'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    expect(result).toBeDefined();
    expect(result!.mood).toEqual('Thirsty');
  });

  it('should return plant with Needs Sun mood when recently watered but low light', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

    const createdPlant = await createTestPlant({
      name: 'Dim Plant',
      last_watered_date: recentDate,
      light_exposure: 'low'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    expect(result).toBeDefined();
    expect(result!.mood).toEqual('Needs Sun');
  });

  it('should return plant with Wilting mood when not watered recently and low light', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 14); // 14 days ago

    const createdPlant = await createTestPlant({
      name: 'Wilting Plant',
      last_watered_date: oldDate,
      light_exposure: 'low'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    expect(result).toBeDefined();
    expect(result!.mood).toEqual('Wilting');
  });

  it('should handle plants with different types correctly', async () => {
    const createdPlant = await createTestPlant({
      name: 'Snake Plant',
      type: 'Sansevieria',
      last_watered_date: new Date(),
      light_exposure: 'medium'
    });

    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Snake Plant');
    expect(result!.type).toEqual('Sansevieria');
    expect(result!.mood).toEqual('Happy'); // Recently watered with medium light
  });

  it('should verify plant exists in database after creation', async () => {
    const createdPlant = await createTestPlant({
      name: 'Database Test Plant',
      type: 'Test Species'
    });

    // Query database directly to verify the plant exists
    const dbPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, createdPlant.id))
      .execute();

    expect(dbPlants).toHaveLength(1);
    expect(dbPlants[0].name).toEqual('Database Test Plant');
    expect(dbPlants[0].type).toEqual('Test Species');

    // Now test the handler
    const input: GetPlantInput = {
      id: createdPlant.id
    };

    const result = await getPlant(input);
    expect(result).toBeDefined();
    expect(result!.name).toEqual('Database Test Plant');
  });
});
