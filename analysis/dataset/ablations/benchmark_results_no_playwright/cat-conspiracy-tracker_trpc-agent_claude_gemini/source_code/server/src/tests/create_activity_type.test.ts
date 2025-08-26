import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { type CreateActivityTypeInput } from '../schema';
import { createActivityType } from '../handlers/create_activity_type';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateActivityTypeInput = {
  name: 'Prolonged Staring',
  description: 'Cat stares at empty corners for extended periods',
  suspicion_points: 5
};

describe('createActivityType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an activity type with all fields', async () => {
    const result = await createActivityType(testInput);

    // Basic field validation
    expect(result.name).toEqual('Prolonged Staring');
    expect(result.description).toEqual('Cat stares at empty corners for extended periods');
    expect(result.suspicion_points).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity type to database', async () => {
    const result = await createActivityType(testInput);

    // Query using proper drizzle syntax
    const activityTypes = await db.select()
      .from(activityTypesTable)
      .where(eq(activityTypesTable.id, result.id))
      .execute();

    expect(activityTypes).toHaveLength(1);
    expect(activityTypes[0].name).toEqual('Prolonged Staring');
    expect(activityTypes[0].description).toEqual('Cat stares at empty corners for extended periods');
    expect(activityTypes[0].suspicion_points).toEqual(5);
    expect(activityTypes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create an activity type with null description', async () => {
    const inputWithNullDescription: CreateActivityTypeInput = {
      name: 'Midnight Zoomies',
      description: null,
      suspicion_points: 3
    };

    const result = await createActivityType(inputWithNullDescription);

    expect(result.name).toEqual('Midnight Zoomies');
    expect(result.description).toBeNull();
    expect(result.suspicion_points).toEqual(3);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const activityTypes = await db.select()
      .from(activityTypesTable)
      .where(eq(activityTypesTable.id, result.id))
      .execute();

    expect(activityTypes[0].description).toBeNull();
  });

  it('should handle different suspicion point values', async () => {
    const highSuspicionInput: CreateActivityTypeInput = {
      name: 'World Domination Planning',
      description: 'Cat arranges objects in suspicious patterns',
      suspicion_points: 10
    };

    const result = await createActivityType(highSuspicionInput);

    expect(result.suspicion_points).toEqual(10);
    expect(typeof result.suspicion_points).toEqual('number');
  });

  it('should create multiple activity types with unique IDs', async () => {
    const input1: CreateActivityTypeInput = {
      name: 'Knocking Items Off Shelves',
      description: 'Deliberately pushing objects to the floor',
      suspicion_points: 4
    };

    const input2: CreateActivityTypeInput = {
      name: 'Hiding in Boxes',
      description: 'Concealing identity in cardboard structures',
      suspicion_points: 2
    };

    const result1 = await createActivityType(input1);
    const result2 = await createActivityType(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Knocking Items Off Shelves');
    expect(result2.name).toEqual('Hiding in Boxes');

    // Verify both exist in database
    const allActivityTypes = await db.select()
      .from(activityTypesTable)
      .execute();

    expect(allActivityTypes).toHaveLength(2);
  });

  it('should handle minimum suspicion points correctly', async () => {
    const minPointsInput: CreateActivityTypeInput = {
      name: 'Innocent Meowing',
      description: 'Basic suspicious meowing behavior',
      suspicion_points: 1
    };

    const result = await createActivityType(minPointsInput);
    expect(result.suspicion_points).toEqual(1);
  });
});
