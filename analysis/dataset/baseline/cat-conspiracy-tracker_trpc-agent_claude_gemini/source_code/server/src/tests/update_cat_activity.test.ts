import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { type UpdateCatActivityInput } from '../schema';
import { updateCatActivity } from '../handlers/update_cat_activity';
import { eq, sql } from 'drizzle-orm';

describe('updateCatActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a cat activity with all fields', async () => {
    // Create test behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create another behavior type for update
    const [newBehaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Knocking Things Over',
        conspiracy_score: 8,
        is_custom: false
      })
      .returning()
      .execute();

    // Create initial activity
    const [initialActivity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Original description',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Update the activity
    const updateInput: UpdateCatActivityInput = {
      id: initialActivity.id,
      behavior_type_id: newBehaviorType.id,
      description: 'Updated description',
      cat_name: 'Mr. Whiskers',
      activity_date: new Date('2024-01-16T14:00:00Z')
    };

    const result = await updateCatActivity(updateInput);

    expect(result.id).toEqual(initialActivity.id);
    expect(result.behavior_type_id).toEqual(newBehaviorType.id);
    expect(result.description).toEqual('Updated description');
    expect(result.cat_name).toEqual('Mr. Whiskers');
    expect(result.activity_date).toEqual(new Date('2024-01-16T14:00:00Z'));
    expect(result.created_at).toEqual(initialActivity.created_at);
  });

  it('should update partial fields only', async () => {
    // Create test behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create initial activity
    const [initialActivity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Original description',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Update only description
    const updateInput: UpdateCatActivityInput = {
      id: initialActivity.id,
      description: 'Updated description only'
    };

    const result = await updateCatActivity(updateInput);

    expect(result.id).toEqual(initialActivity.id);
    expect(result.behavior_type_id).toEqual(behaviorType.id); // unchanged
    expect(result.description).toEqual('Updated description only');
    expect(result.cat_name).toEqual('Fluffy'); // unchanged
    expect(result.activity_date).toEqual(new Date('2024-01-15T10:00:00Z')); // unchanged
  });

  it('should update cat_name to null', async () => {
    // Create test behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create initial activity
    const [initialActivity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Test description',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Update cat_name to null
    const updateInput: UpdateCatActivityInput = {
      id: initialActivity.id,
      cat_name: null
    };

    const result = await updateCatActivity(updateInput);

    expect(result.cat_name).toBeNull();
  });

  it('should save updated activity to database', async () => {
    // Create test behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create initial activity
    const [initialActivity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Original description',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Update the activity
    const updateInput: UpdateCatActivityInput = {
      id: initialActivity.id,
      description: 'Updated description'
    };

    await updateCatActivity(updateInput);

    // Verify in database
    const [updatedActivity] = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, initialActivity.id))
      .execute();

    expect(updatedActivity.description).toEqual('Updated description');
    expect(updatedActivity.behavior_type_id).toEqual(behaviorType.id);
    expect(updatedActivity.cat_name).toEqual('Fluffy');
  });

  it('should recalculate daily conspiracy levels when activity date changes', async () => {
    // Create behavior types
    const [behaviorType1] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    const [behaviorType2] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Knocking Things Over',
        conspiracy_score: 8,
        is_custom: false
      })
      .returning()
      .execute();

    // Create activities on different dates
    const [activity1] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType1.id,
        description: 'Activity 1',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType2.id,
        description: 'Activity 2',
        cat_name: 'Whiskers',
        activity_date: new Date('2024-01-15T11:00:00Z')
      })
      .returning()
      .execute();

    // Create initial daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 13, // 5 + 8
        activity_count: 2
      })
      .execute();

    // Update activity1 to move to a different date
    const updateInput: UpdateCatActivityInput = {
      id: activity1.id,
      activity_date: new Date('2024-01-16T10:00:00Z')
    };

    await updateCatActivity(updateInput);

    // Check old date (should have reduced totals)
    const [oldDateLevel] = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(oldDateLevel.total_conspiracy_score).toEqual(8); // Only activity2
    expect(oldDateLevel.activity_count).toEqual(1);

    // Check new date (should have new totals)
    const [newDateLevel] = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-16'))
      .execute();

    expect(newDateLevel.total_conspiracy_score).toEqual(5); // Only activity1
    expect(newDateLevel.activity_count).toEqual(1);
  });

  it('should recalculate daily conspiracy levels when behavior type changes', async () => {
    // Create behavior types
    const [behaviorType1] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    const [behaviorType2] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Knocking Things Over',
        conspiracy_score: 8,
        is_custom: false
      })
      .returning()
      .execute();

    // Create activity
    const [activity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType1.id,
        description: 'Test activity',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Create initial daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 5,
        activity_count: 1
      })
      .execute();

    // Update behavior type
    const updateInput: UpdateCatActivityInput = {
      id: activity.id,
      behavior_type_id: behaviorType2.id
    };

    await updateCatActivity(updateInput);

    // Check updated conspiracy level
    const [updatedLevel] = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(updatedLevel.total_conspiracy_score).toEqual(8); // Changed from 5 to 8
    expect(updatedLevel.activity_count).toEqual(1);
  });

  it('should throw error when activity not found', async () => {
    const updateInput: UpdateCatActivityInput = {
      id: 999999,
      description: 'Updated description'
    };

    await expect(updateCatActivity(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when behavior type not found', async () => {
    // Create test behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create activity
    const [activity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Test activity',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Try to update with non-existent behavior type
    const updateInput: UpdateCatActivityInput = {
      id: activity.id,
      behavior_type_id: 999999
    };

    await expect(updateCatActivity(updateInput)).rejects.toThrow(/behavior type.*not found/i);
  });

  it('should delete daily conspiracy level when last activity is moved from date', async () => {
    // Create behavior type
    const [behaviorType] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring at Wall',
        conspiracy_score: 5,
        is_custom: false
      })
      .returning()
      .execute();

    // Create single activity
    const [activity] = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Test activity',
        cat_name: 'Fluffy',
        activity_date: new Date('2024-01-15T10:00:00Z')
      })
      .returning()
      .execute();

    // Create daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 5,
        activity_count: 1
      })
      .execute();

    // Move activity to different date
    const updateInput: UpdateCatActivityInput = {
      id: activity.id,
      activity_date: new Date('2024-01-16T10:00:00Z')
    };

    await updateCatActivity(updateInput);

    // Check that old date record was deleted
    const oldDateLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(oldDateLevels).toHaveLength(0);

    // Check that new date record was created
    const newDateLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-16'))
      .execute();

    expect(newDateLevels).toHaveLength(1);
    expect(newDateLevels[0].total_conspiracy_score).toEqual(5);
    expect(newDateLevels[0].activity_count).toEqual(1);
  });
});
