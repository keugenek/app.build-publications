import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable, catActivitiesTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput } from '../schema';
import { getActivitiesByDateRange } from '../handlers/get_activities_by_date_range';

describe('getActivitiesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return activities within specified date range with behavior type details', async () => {
    // Create test behavior type
    const behaviorTypeResults = await db.insert(behaviorTypesTable)
      .values({
        name: 'Suspicious Staring',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypeResults[0];

    // Create test activities across different dates
    const baseDate = new Date('2024-01-15');
    const activities = [
      {
        behavior_type_id: behaviorType.id,
        description: 'Cat stared at empty corner for 10 minutes',
        cat_name: 'Whiskers',
        activity_date: new Date('2024-01-15T10:00:00Z')
      },
      {
        behavior_type_id: behaviorType.id,
        description: 'Cat followed me to bathroom again',
        cat_name: 'Mittens',
        activity_date: new Date('2024-01-16T14:30:00Z')
      },
      {
        behavior_type_id: behaviorType.id,
        description: 'Cat knocked over plant mysteriously',
        cat_name: null,
        activity_date: new Date('2024-01-20T09:15:00Z') // Outside range
      }
    ];

    await db.insert(catActivitiesTable)
      .values(activities)
      .execute();

    // Test date range input
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-17')
    };

    const results = await getActivitiesByDateRange(input);

    // Should return 2 activities within date range
    expect(results).toHaveLength(2);

    // Verify results are ordered by activity_date descending (newest first)
    expect(results[0].activity_date.getTime()).toBeGreaterThan(results[1].activity_date.getTime());
    expect(results[0].description).toEqual('Cat followed me to bathroom again');
    expect(results[1].description).toEqual('Cat stared at empty corner for 10 minutes');

    // Verify behavior type details are included
    results.forEach(activity => {
      expect(activity.behavior_type).toBeDefined();
      expect(activity.behavior_type.id).toEqual(behaviorType.id);
      expect(activity.behavior_type.name).toEqual('Suspicious Staring');
      expect(activity.behavior_type.conspiracy_score).toEqual(7);
      expect(activity.behavior_type.is_custom).toEqual(false);
      expect(activity.behavior_type.created_at).toBeInstanceOf(Date);
    });

    // Verify activity fields are properly mapped
    expect(results[0].id).toBeDefined();
    expect(results[0].behavior_type_id).toEqual(behaviorType.id);
    expect(results[0].cat_name).toEqual('Mittens');
    expect(results[0].activity_date).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);

    expect(results[1].cat_name).toEqual('Whiskers');
  });

  it('should return empty array when no activities exist in date range', async () => {
    // Create behavior type but no activities
    await db.insert(behaviorTypesTable)
      .values({
        name: 'Test Behavior',
        conspiracy_score: 5,
        is_custom: true
      })
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    expect(results).toHaveLength(0);
  });

  it('should handle activities on exact boundary dates', async () => {
    // Create test behavior type
    const behaviorTypeResults = await db.insert(behaviorTypesTable)
      .values({
        name: 'Boundary Behavior',
        conspiracy_score: 3,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypeResults[0];

    // Create activities on start and end dates
    const activities = [
      {
        behavior_type_id: behaviorType.id,
        description: 'Activity on start date',
        cat_name: 'Start Cat',
        activity_date: new Date('2024-01-01T10:00:00Z')
      },
      {
        behavior_type_id: behaviorType.id,
        description: 'Activity on end date',
        cat_name: 'End Cat',
        activity_date: new Date('2024-01-31T15:30:00Z')
      },
      {
        behavior_type_id: behaviorType.id,
        description: 'Activity before range',
        cat_name: 'Before Cat',
        activity_date: new Date('2023-12-31T23:59:59Z')
      },
      {
        behavior_type_id: behaviorType.id,
        description: 'Activity after range',
        cat_name: 'After Cat',
        activity_date: new Date('2024-02-01T00:00:00Z')
      }
    ];

    await db.insert(catActivitiesTable)
      .values(activities)
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    // Should include activities on boundary dates
    expect(results).toHaveLength(2);
    
    const descriptions = results.map(r => r.description);
    expect(descriptions).toContain('Activity on start date');
    expect(descriptions).toContain('Activity on end date');
    expect(descriptions).not.toContain('Activity before range');
    expect(descriptions).not.toContain('Activity after range');
  });

  it('should handle activities with null cat_name correctly', async () => {
    // Create test behavior type
    const behaviorTypeResults = await db.insert(behaviorTypesTable)
      .values({
        name: 'Anonymous Behavior',
        conspiracy_score: 6,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorType = behaviorTypeResults[0];

    // Create activity with null cat_name
    await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType.id,
        description: 'Mysterious activity with no cat name',
        cat_name: null,
        activity_date: new Date('2024-01-15T12:00:00Z')
      })
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].cat_name).toBeNull();
    expect(results[0].description).toEqual('Mysterious activity with no cat name');
  });

  it('should handle multiple behavior types correctly', async () => {
    // Create multiple behavior types
    const behaviorType1Results = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring',
        conspiracy_score: 8,
        is_custom: false
      })
      .returning()
      .execute();

    const behaviorType2Results = await db.insert(behaviorTypesTable)
      .values({
        name: 'Following',
        conspiracy_score: 4,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorType1 = behaviorType1Results[0];
    const behaviorType2 = behaviorType2Results[0];

    // Create activities with different behavior types
    const activities = [
      {
        behavior_type_id: behaviorType1.id,
        description: 'Suspicious staring activity',
        cat_name: 'Observer',
        activity_date: new Date('2024-01-15T10:00:00Z')
      },
      {
        behavior_type_id: behaviorType2.id,
        description: 'Following around house',
        cat_name: 'Stalker',
        activity_date: new Date('2024-01-16T14:00:00Z')
      }
    ];

    await db.insert(catActivitiesTable)
      .values(activities)
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    expect(results).toHaveLength(2);

    // Verify each activity has correct behavior type details
    const staringActivity = results.find(r => r.description === 'Suspicious staring activity');
    const followingActivity = results.find(r => r.description === 'Following around house');

    expect(staringActivity?.behavior_type.name).toEqual('Staring');
    expect(staringActivity?.behavior_type.conspiracy_score).toEqual(8);
    expect(staringActivity?.behavior_type.is_custom).toEqual(false);

    expect(followingActivity?.behavior_type.name).toEqual('Following');
    expect(followingActivity?.behavior_type.conspiracy_score).toEqual(4);
    expect(followingActivity?.behavior_type.is_custom).toEqual(true);
  });
});
