import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { deleteCatActivity } from '../handlers/delete_cat_activity';
import { eq, sql } from 'drizzle-orm';

describe('deleteCatActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a cat activity', async () => {
    // Create behavior type
    const behaviorTypes = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring ominously',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypes[0];

    // Create cat activity
    const activities = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Cat was staring at the wall for 10 minutes',
        cat_name: 'Whiskers',
        activity_date: new Date('2024-01-15T10:30:00Z')
      })
      .returning()
      .execute();

    const activity = activities[0];

    // Create initial daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 7,
        activity_count: 1
      })
      .execute();

    // Delete the activity
    await deleteCatActivity(activity.id);

    // Verify activity was deleted
    const remainingActivities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, activity.id))
      .execute();

    expect(remainingActivities).toHaveLength(0);
  });

  it('should recalculate daily conspiracy level after deletion', async () => {
    // Create behavior types
    const behaviorTypes = await db.insert(behaviorTypesTable)
      .values([
        {
          name: 'Staring ominously',
          conspiracy_score: 7,
          is_custom: false
        },
        {
          name: 'Knocking things over',
          conspiracy_score: 5,
          is_custom: false
        }
      ])
      .returning()
      .execute();

    const [behaviorType1, behaviorType2] = behaviorTypes;

    // Create multiple activities for the same date
    const activities = await db.insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorType1.id,
          description: 'Cat was staring at the wall',
          cat_name: 'Whiskers',
          activity_date: new Date('2024-01-15T10:30:00Z')
        },
        {
          behavior_type_id: behaviorType2.id,
          description: 'Cat knocked over a plant',
          cat_name: 'Whiskers',
          activity_date: new Date('2024-01-15T14:00:00Z')
        }
      ])
      .returning()
      .execute();

    const [activity1, activity2] = activities;

    // Create initial daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 12, // 7 + 5
        activity_count: 2
      })
      .execute();

    // Delete one activity
    await deleteCatActivity(activity1.id);

    // Verify daily conspiracy level was recalculated
    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(1);
    expect(dailyLevels[0].total_conspiracy_score).toEqual(5); // Only activity2 remains
    expect(dailyLevels[0].activity_count).toEqual(1);

    // Verify the other activity still exists
    const remainingActivities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, activity2.id))
      .execute();

    expect(remainingActivities).toHaveLength(1);
  });

  it('should remove daily conspiracy level when deleting the last activity for a date', async () => {
    // Create behavior type
    const behaviorTypes = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring ominously',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypes[0];

    // Create single activity
    const activities = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Cat was staring at the wall',
        cat_name: 'Whiskers',
        activity_date: new Date('2024-01-15T10:30:00Z')
      })
      .returning()
      .execute();

    const activity = activities[0];

    // Create daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 7,
        activity_count: 1
      })
      .execute();

    // Delete the only activity
    await deleteCatActivity(activity.id);

    // Verify daily conspiracy level was removed
    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent activity', async () => {
    const nonExistentId = 99999;

    await expect(deleteCatActivity(nonExistentId)).rejects.toThrow(/Cat activity with id 99999 not found/i);
  });

  it('should handle activities with different dates correctly', async () => {
    // Create behavior type
    const behaviorTypes = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring ominously',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypes[0];

    // Create activities on different dates
    const activities = await db.insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorType.id,
          description: 'Activity on Jan 15',
          cat_name: 'Whiskers',
          activity_date: new Date('2024-01-15T10:30:00Z')
        },
        {
          behavior_type_id: behaviorType.id,
          description: 'Activity on Jan 16',
          cat_name: 'Whiskers',
          activity_date: new Date('2024-01-16T10:30:00Z')
        }
      ])
      .returning()
      .execute();

    const [activity1, activity2] = activities;

    // Create daily conspiracy levels for both dates
    await db.insert(dailyConspiracyLevelsTable)
      .values([
        {
          date: '2024-01-15',
          total_conspiracy_score: 7,
          activity_count: 1
        },
        {
          date: '2024-01-16',
          total_conspiracy_score: 7,
          activity_count: 1
        }
      ])
      .execute();

    // Delete activity from Jan 15
    await deleteCatActivity(activity1.id);

    // Verify only Jan 15 conspiracy level was affected
    const jan15Level = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    const jan16Level = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-16'))
      .execute();

    expect(jan15Level).toHaveLength(0); // Should be deleted
    expect(jan16Level).toHaveLength(1); // Should remain unchanged
    expect(jan16Level[0].total_conspiracy_score).toEqual(7);
    expect(jan16Level[0].activity_count).toEqual(1);

    // Verify Jan 16 activity still exists
    const remainingActivities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, activity2.id))
      .execute();

    expect(remainingActivities).toHaveLength(1);
  });

  it('should handle activities with null cat_name', async () => {
    // Create behavior type
    const behaviorTypes = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring ominously',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypes[0];

    // Create activity with null cat_name
    const activities = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Cat was staring at the wall',
        cat_name: null,
        activity_date: new Date('2024-01-15T10:30:00Z')
      })
      .returning()
      .execute();

    const activity = activities[0];

    // Create daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 7,
        activity_count: 1
      })
      .execute();

    // Should delete successfully
    await deleteCatActivity(activity.id);

    // Verify activity was deleted and conspiracy level removed
    const remainingActivities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, activity.id))
      .execute();

    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(remainingActivities).toHaveLength(0);
    expect(dailyLevels).toHaveLength(0);
  });
});
