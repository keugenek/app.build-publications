import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type CreateBehaviorTypeInput } from '../schema';
import { createBehaviorType } from '../handlers/create_behavior_type';
import { eq } from 'drizzle-orm';

// Test input for custom behavior type
const customBehaviorInput: CreateBehaviorTypeInput = {
  name: 'Staring at Wall Intensely',
  conspiracy_score: 7,
  is_custom: true
};

// Test input for predefined behavior type
const predefinedBehaviorInput: CreateBehaviorTypeInput = {
  name: 'Knocking Things Off Tables',
  conspiracy_score: 9,
  is_custom: false
};

describe('createBehaviorType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a custom behavior type', async () => {
    const result = await createBehaviorType(customBehaviorInput);

    // Basic field validation
    expect(result.name).toEqual('Staring at Wall Intensely');
    expect(result.conspiracy_score).toEqual(7);
    expect(result.is_custom).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a predefined behavior type', async () => {
    const result = await createBehaviorType(predefinedBehaviorInput);

    // Basic field validation
    expect(result.name).toEqual('Knocking Things Off Tables');
    expect(result.conspiracy_score).toEqual(9);
    expect(result.is_custom).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save behavior type to database', async () => {
    const result = await createBehaviorType(customBehaviorInput);

    // Query using proper drizzle syntax
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, result.id))
      .execute();

    expect(behaviorTypes).toHaveLength(1);
    expect(behaviorTypes[0].name).toEqual('Staring at Wall Intensely');
    expect(behaviorTypes[0].conspiracy_score).toEqual(7);
    expect(behaviorTypes[0].is_custom).toEqual(true);
    expect(behaviorTypes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different conspiracy scores', async () => {
    const minScoreInput: CreateBehaviorTypeInput = {
      name: 'Innocent Meowing',
      conspiracy_score: 1,
      is_custom: true
    };

    const maxScoreInput: CreateBehaviorTypeInput = {
      name: 'World Domination Planning',
      conspiracy_score: 10,
      is_custom: true
    };

    const minResult = await createBehaviorType(minScoreInput);
    const maxResult = await createBehaviorType(maxScoreInput);

    expect(minResult.conspiracy_score).toEqual(1);
    expect(maxResult.conspiracy_score).toEqual(10);

    // Verify both are saved to database
    const savedBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .execute();

    expect(savedBehaviorTypes).toHaveLength(2);
  });

  it('should use default is_custom value when not specified', async () => {
    const inputWithDefault = {
      name: 'Default Custom Type',
      conspiracy_score: 5
      // is_custom not specified, should default to true
    };

    // This works because Zod applies the default before the handler receives the input
    const result = await createBehaviorType(inputWithDefault as CreateBehaviorTypeInput);

    expect(result.is_custom).toEqual(true);
  });

  it('should create multiple behavior types with unique IDs', async () => {
    const firstInput: CreateBehaviorTypeInput = {
      name: 'First Behavior',
      conspiracy_score: 3,
      is_custom: true
    };

    const secondInput: CreateBehaviorTypeInput = {
      name: 'Second Behavior',
      conspiracy_score: 6,
      is_custom: false
    };

    const first = await createBehaviorType(firstInput);
    const second = await createBehaviorType(secondInput);

    expect(first.id).not.toEqual(second.id);
    expect(first.name).toEqual('First Behavior');
    expect(second.name).toEqual('Second Behavior');
    expect(first.created_at).toBeInstanceOf(Date);
    expect(second.created_at).toBeInstanceOf(Date);

    // Verify both are in database
    const allBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .execute();

    expect(allBehaviorTypes).toHaveLength(2);
  });
});
