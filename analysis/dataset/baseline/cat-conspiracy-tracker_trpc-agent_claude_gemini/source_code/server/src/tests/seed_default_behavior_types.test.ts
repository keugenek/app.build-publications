import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { seedDefaultBehaviorTypes } from '../handlers/seed_default_behavior_types';
import { eq } from 'drizzle-orm';

describe('seedDefaultBehaviorTypes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create all default behavior types', async () => {
    const result = await seedDefaultBehaviorTypes();

    // Should return 8 default behavior types
    expect(result).toHaveLength(8);

    // Verify each behavior type has the correct properties
    result.forEach(behaviorType => {
      expect(behaviorType.id).toBeDefined();
      expect(behaviorType.name).toBeDefined();
      expect(typeof behaviorType.conspiracy_score).toBe('number');
      expect(behaviorType.conspiracy_score).toBeGreaterThanOrEqual(1);
      expect(behaviorType.conspiracy_score).toBeLessThanOrEqual(10);
      expect(behaviorType.is_custom).toBe(false);
      expect(behaviorType.created_at).toBeInstanceOf(Date);
    });
  });

  it('should create correct behavior types with expected scores', async () => {
    const result = await seedDefaultBehaviorTypes();

    // Create a map for easier lookup
    const behaviorTypeMap = new Map(
      result.map(bt => [bt.name, bt])
    );

    // Verify specific behavior types and their conspiracy scores
    expect(behaviorTypeMap.get('Prolonged Staring')?.conspiracy_score).toBe(7);
    expect(behaviorTypeMap.get('Gifts of Dead Insects')?.conspiracy_score).toBe(9);
    expect(behaviorTypeMap.get('Sudden Zoomies')?.conspiracy_score).toBe(5);
    expect(behaviorTypeMap.get('Mysterious Whispers')?.conspiracy_score).toBe(8);
    expect(behaviorTypeMap.get('Doorway Obstruction')?.conspiracy_score).toBe(6);
    expect(behaviorTypeMap.get('3 AM Shenanigans')?.conspiracy_score).toBe(10);
    expect(behaviorTypeMap.get('Suspicious Knocking')?.conspiracy_score).toBe(8);
    expect(behaviorTypeMap.get('Invisible Hunting')?.conspiracy_score).toBe(4);
  });

  it('should save behavior types to database', async () => {
    await seedDefaultBehaviorTypes();

    // Query all behavior types from database
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .execute();

    expect(behaviorTypes).toHaveLength(8);

    // Verify all are marked as non-custom
    behaviorTypes.forEach(behaviorType => {
      expect(behaviorType.is_custom).toBe(false);
      expect(behaviorType.created_at).toBeInstanceOf(Date);
    });
  });

  it('should not duplicate existing behavior types', async () => {
    // Seed behavior types first time
    const firstResult = await seedDefaultBehaviorTypes();
    expect(firstResult).toHaveLength(8);

    // Seed again - should not create duplicates
    const secondResult = await seedDefaultBehaviorTypes();
    expect(secondResult).toHaveLength(8);

    // Verify database only has 8 behavior types total
    const allBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .execute();

    expect(allBehaviorTypes).toHaveLength(8);
  });

  it('should return existing behavior types when they already exist', async () => {
    // Create one behavior type manually first
    await db.insert(behaviorTypesTable)
      .values({
        name: 'Prolonged Staring',
        conspiracy_score: 7,
        is_custom: false
      })
      .execute();

    // Seed should return all 8, including the existing one
    const result = await seedDefaultBehaviorTypes();
    expect(result).toHaveLength(8);

    // Verify the specific behavior type exists in results
    const prolongedStaring = result.find(bt => bt.name === 'Prolonged Staring');
    expect(prolongedStaring).toBeDefined();
    expect(prolongedStaring?.conspiracy_score).toBe(7);
    expect(prolongedStaring?.is_custom).toBe(false);
  });

  it('should handle partial existing behavior types correctly', async () => {
    // Create some behavior types manually first
    await db.insert(behaviorTypesTable)
      .values([
        { name: 'Prolonged Staring', conspiracy_score: 7, is_custom: false },
        { name: 'Sudden Zoomies', conspiracy_score: 5, is_custom: false },
        { name: 'Custom Behavior', conspiracy_score: 6, is_custom: true }
      ])
      .execute();

    // Seed should create remaining default types
    const result = await seedDefaultBehaviorTypes();
    expect(result).toHaveLength(8);

    // Verify total count in database (8 defaults + 1 custom)
    const allBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .execute();

    expect(allBehaviorTypes).toHaveLength(9);

    // Verify we still have the custom behavior type
    const customBehavior = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.name, 'Custom Behavior'))
      .execute();

    expect(customBehavior).toHaveLength(1);
    expect(customBehavior[0].is_custom).toBe(true);
  });
});
