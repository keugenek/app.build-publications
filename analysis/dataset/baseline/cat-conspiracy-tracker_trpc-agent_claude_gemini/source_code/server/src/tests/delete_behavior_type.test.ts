import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable, catActivitiesTable } from '../db/schema';
import { deleteBehaviorType } from '../handlers/delete_behavior_type';
import { eq } from 'drizzle-orm';

describe('deleteBehaviorType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a custom behavior type successfully', async () => {
    // Create a custom behavior type
    const behaviorTypeResult = await db.insert(behaviorTypesTable)
      .values({
        name: 'Custom Suspicious Behavior',
        conspiracy_score: 7,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorTypeId = behaviorTypeResult[0].id;

    // Delete the behavior type
    await deleteBehaviorType(behaviorTypeId);

    // Verify it's deleted
    const deletedBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, behaviorTypeId))
      .execute();

    expect(deletedBehaviorTypes).toHaveLength(0);
  });

  it('should throw error when behavior type does not exist', async () => {
    const nonExistentId = 99999;

    await expect(deleteBehaviorType(nonExistentId))
      .rejects
      .toThrow(/Behavior type with id 99999 not found/i);
  });

  it('should throw error when trying to delete predefined behavior type', async () => {
    // Create a predefined behavior type
    const behaviorTypeResult = await db.insert(behaviorTypesTable)
      .values({
        name: 'Predefined Behavior',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorTypeId = behaviorTypeResult[0].id;

    await expect(deleteBehaviorType(behaviorTypeId))
      .rejects
      .toThrow(/Cannot delete predefined behavior types/i);

    // Verify behavior type still exists
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, behaviorTypeId))
      .execute();

    expect(behaviorTypes).toHaveLength(1);
  });

  it('should throw error when behavior type is referenced by activities', async () => {
    // Create a custom behavior type
    const behaviorTypeResult = await db.insert(behaviorTypesTable)
      .values({
        name: 'Custom Behavior With Activities',
        conspiracy_score: 8,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorTypeId = behaviorTypeResult[0].id;

    // Create an activity that references this behavior type
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorTypeId,
        description: 'Cat was plotting world domination',
        cat_name: 'Whiskers',
        activity_date: new Date()
      })
      .execute();

    // Try to delete the behavior type
    await expect(deleteBehaviorType(behaviorTypeId))
      .rejects
      .toThrow(/Cannot delete behavior type: 1 activities are using this behavior type/i);

    // Verify behavior type still exists
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, behaviorTypeId))
      .execute();

    expect(behaviorTypes).toHaveLength(1);
  });

  it('should throw error when behavior type has multiple activities', async () => {
    // Create a custom behavior type
    const behaviorTypeResult = await db.insert(behaviorTypesTable)
      .values({
        name: 'Popular Custom Behavior',
        conspiracy_score: 6,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorTypeId = behaviorTypeResult[0].id;

    // Create multiple activities that reference this behavior type
    await db.insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorTypeId,
          description: 'First suspicious activity',
          cat_name: 'Felix',
          activity_date: new Date()
        },
        {
          behavior_type_id: behaviorTypeId,
          description: 'Second suspicious activity',
          cat_name: 'Shadow',
          activity_date: new Date()
        },
        {
          behavior_type_id: behaviorTypeId,
          description: 'Third suspicious activity',
          cat_name: null, // Test with null cat_name
          activity_date: new Date()
        }
      ])
      .execute();

    // Try to delete the behavior type
    await expect(deleteBehaviorType(behaviorTypeId))
      .rejects
      .toThrow(/Cannot delete behavior type: 3 activities are using this behavior type/i);

    // Verify behavior type still exists
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, behaviorTypeId))
      .execute();

    expect(behaviorTypes).toHaveLength(1);
  });

  it('should handle deletion of behavior type with id that exists but activities exist for different behavior type', async () => {
    // Create two custom behavior types
    const behaviorType1Result = await db.insert(behaviorTypesTable)
      .values({
        name: 'Deletable Behavior',
        conspiracy_score: 4,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorType2Result = await db.insert(behaviorTypesTable)
      .values({
        name: 'Behavior With Activities',
        conspiracy_score: 9,
        is_custom: true
      })
      .returning()
      .execute();

    const deletableBehaviorTypeId = behaviorType1Result[0].id;
    const behaviorTypeWithActivitiesId = behaviorType2Result[0].id;

    // Create activity for the second behavior type only
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorTypeWithActivitiesId,
        description: 'Activity for different behavior type',
        cat_name: 'Mittens',
        activity_date: new Date()
      })
      .execute();

    // Should be able to delete the first behavior type (no activities reference it)
    await deleteBehaviorType(deletableBehaviorTypeId);

    // Verify the first behavior type is deleted
    const deletedBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, deletableBehaviorTypeId))
      .execute();

    expect(deletedBehaviorTypes).toHaveLength(0);

    // Verify the second behavior type still exists
    const remainingBehaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, behaviorTypeWithActivitiesId))
      .execute();

    expect(remainingBehaviorTypes).toHaveLength(1);
  });
});
