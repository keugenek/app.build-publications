import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable, catActivitiesTable } from '../db/schema';
import { getCatActivities } from '../handlers/get_cat_activities';

describe('getCatActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    const result = await getCatActivities();
    expect(result).toHaveLength(0);
  });

  it('should get cat activities with behavior type information', async () => {
    // Create a behavior type first
    const behaviorType = await db.insert(behaviorTypesTable)
      .values({
        name: 'Suspicious Staring',
        conspiracy_score: 8,
        is_custom: false
      })
      .returning()
      .execute();

    // Create a cat activity
    const activityDate = new Date('2024-01-15T10:30:00Z');
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType[0].id,
        description: 'Whiskers was staring at the wall for 30 minutes straight',
        cat_name: 'Whiskers',
        activity_date: activityDate
      })
      .execute();

    const result = await getCatActivities();

    expect(result).toHaveLength(1);
    const activity = result[0];

    // Verify activity fields
    expect(activity.id).toBeDefined();
    expect(activity.behavior_type_id).toEqual(behaviorType[0].id);
    expect(activity.description).toEqual('Whiskers was staring at the wall for 30 minutes straight');
    expect(activity.cat_name).toEqual('Whiskers');
    expect(activity.activity_date).toBeInstanceOf(Date);
    expect(activity.activity_date.getTime()).toEqual(activityDate.getTime());
    expect(activity.created_at).toBeInstanceOf(Date);

    // Verify nested behavior type information
    expect(activity.behavior_type).toBeDefined();
    expect(activity.behavior_type.id).toEqual(behaviorType[0].id);
    expect(activity.behavior_type.name).toEqual('Suspicious Staring');
    expect(activity.behavior_type.conspiracy_score).toEqual(8);
    expect(activity.behavior_type.is_custom).toEqual(false);
    expect(activity.behavior_type.created_at).toBeInstanceOf(Date);
  });

  it('should handle activities with null cat_name', async () => {
    // Create a behavior type
    const behaviorType = await db.insert(behaviorTypesTable)
      .values({
        name: 'Mysterious Disappearance',
        conspiracy_score: 5,
        is_custom: true
      })
      .returning()
      .execute();

    // Create activity with null cat_name
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType[0].id,
        description: 'Cat vanished for hours',
        cat_name: null,
        activity_date: new Date('2024-01-16T14:00:00Z')
      })
      .execute();

    const result = await getCatActivities();

    expect(result).toHaveLength(1);
    expect(result[0].cat_name).toBeNull();
    expect(result[0].description).toEqual('Cat vanished for hours');
  });

  it('should return activities ordered by activity_date descending', async () => {
    // Create a behavior type
    const behaviorType = await db.insert(behaviorTypesTable)
      .values({
        name: 'Test Behavior',
        conspiracy_score: 3,
        is_custom: false
      })
      .returning()
      .execute();

    // Create multiple activities with different dates
    const dates = [
      new Date('2024-01-10T10:00:00Z'),
      new Date('2024-01-15T12:00:00Z'),
      new Date('2024-01-12T14:00:00Z')
    ];

    for (let i = 0; i < dates.length; i++) {
      await db.insert(catActivitiesTable)
        .values({
          behavior_type_id: behaviorType[0].id,
          description: `Activity ${i + 1}`,
          cat_name: 'Test Cat',
          activity_date: dates[i]
        })
        .execute();
    }

    const result = await getCatActivities();

    expect(result).toHaveLength(3);

    // Verify ordering (newest first)
    expect(result[0].activity_date.getTime()).toEqual(new Date('2024-01-15T12:00:00Z').getTime());
    expect(result[1].activity_date.getTime()).toEqual(new Date('2024-01-12T14:00:00Z').getTime());
    expect(result[2].activity_date.getTime()).toEqual(new Date('2024-01-10T10:00:00Z').getTime());

    // Verify descriptions match the expected order
    expect(result[0].description).toEqual('Activity 2');
    expect(result[1].description).toEqual('Activity 3');
    expect(result[2].description).toEqual('Activity 1');
  });

  it('should handle multiple activities with different behavior types', async () => {
    // Create multiple behavior types
    const behaviorType1 = await db.insert(behaviorTypesTable)
      .values({
        name: 'Plotting',
        conspiracy_score: 9,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType2 = await db.insert(behaviorTypesTable)
      .values({
        name: 'Surveillance',
        conspiracy_score: 7,
        is_custom: true
      })
      .returning()
      .execute();

    // Create activities for each behavior type
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType1[0].id,
        description: 'Cat plotting world domination',
        cat_name: 'Evil Cat',
        activity_date: new Date('2024-01-20T16:00:00Z')
      })
      .execute();

    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType2[0].id,
        description: 'Cat watching from window',
        cat_name: 'Spy Cat',
        activity_date: new Date('2024-01-19T08:00:00Z')
      })
      .execute();

    const result = await getCatActivities();

    expect(result).toHaveLength(2);

    // First activity (newest)
    expect(result[0].behavior_type.name).toEqual('Plotting');
    expect(result[0].behavior_type.conspiracy_score).toEqual(9);
    expect(result[0].cat_name).toEqual('Evil Cat');

    // Second activity (older)
    expect(result[1].behavior_type.name).toEqual('Surveillance');
    expect(result[1].behavior_type.conspiracy_score).toEqual(7);
    expect(result[1].cat_name).toEqual('Spy Cat');
  });
});
