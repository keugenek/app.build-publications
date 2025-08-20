import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable, catActivityLogsTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput } from '../schema';
import { getCatActivities } from '../handlers/get_cat_activities';

describe('getCatActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return activities within date range for specific cat', async () => {
    // Create test cat profile
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Whiskers',
        breed: 'Persian',
        color: 'gray',
        age_years: 3,
        suspicion_level: 'high'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Create activities with different dates
    const activities = [
      {
        cat_id: catId,
        activity_type: 'prolonged_staring' as const,
        description: 'Staring at the wall',
        conspiracy_points: 5,
        occurred_at: new Date('2024-01-15T10:00:00Z')
      },
      {
        cat_id: catId,
        activity_type: 'bringing_gifts' as const,
        description: 'Brought a dead mouse',
        conspiracy_points: 8,
        occurred_at: new Date('2024-01-16T14:30:00Z')
      },
      {
        cat_id: catId,
        activity_type: 'knocking_items' as const,
        description: 'Knocked over a plant',
        conspiracy_points: 3,
        occurred_at: new Date('2024-01-20T09:15:00Z') // Outside date range
      }
    ];

    await db.insert(catActivityLogsTable)
      .values(activities)
      .execute();

    // Test input for date range that includes first two activities
    const input: GetActivitiesByDateRangeInput = {
      cat_id: catId,
      start_date: '2024-01-15',
      end_date: '2024-01-17'
    };

    const result = await getCatActivities(input);

    // Should return 2 activities within date range, ordered by occurred_at desc
    expect(result).toHaveLength(2);
    expect(result[0].activity_type).toBe('bringing_gifts'); // Most recent first
    expect(result[1].activity_type).toBe('prolonged_staring'); // Older second
    
    // Verify all returned activities belong to correct cat
    result.forEach(activity => {
      expect(activity.cat_id).toBe(catId);
    });

    // Verify dates are within range
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-17T23:59:59Z');
    result.forEach(activity => {
      expect(activity.occurred_at >= startDate).toBe(true);
      expect(activity.occurred_at <= endDate).toBe(true);
    });
  });

  it('should return empty array when no activities found in date range', async () => {
    // Create test cat profile
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Shadow',
        breed: null,
        color: 'black',
        age_years: null,
        suspicion_level: 'medium'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Create activity outside the query date range
    await db.insert(catActivityLogsTable)
      .values({
        cat_id: catId,
        activity_type: 'midnight_meetings',
        description: 'Secret cat meeting',
        conspiracy_points: 10,
        occurred_at: new Date('2024-01-10T02:00:00Z')
      })
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      cat_id: catId,
      start_date: '2024-01-15',
      end_date: '2024-01-17'
    };

    const result = await getCatActivities(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent cat', async () => {
    const input: GetActivitiesByDateRangeInput = {
      cat_id: 999, // Non-existent cat ID
      start_date: '2024-01-15',
      end_date: '2024-01-17'
    };

    const result = await getCatActivities(input);

    expect(result).toHaveLength(0);
  });

  it('should handle single day date range correctly', async () => {
    // Create test cat profile
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Mittens',
        breed: 'Tabby',
        color: 'orange',
        age_years: 2,
        suspicion_level: 'maximum'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Create activities on the same day but different times
    const activities = [
      {
        cat_id: catId,
        activity_type: 'sudden_zoomies' as const,
        description: 'Morning zoomies',
        conspiracy_points: 4,
        occurred_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        cat_id: catId,
        activity_type: 'vocalizing_at_objects' as const,
        description: 'Talking to the lamp',
        conspiracy_points: 6,
        occurred_at: new Date('2024-01-15T20:00:00Z')
      }
    ];

    await db.insert(catActivityLogsTable)
      .values(activities)
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      cat_id: catId,
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    };

    const result = await getCatActivities(input);

    expect(result).toHaveLength(2);
    // Verify ordering (most recent first)
    expect(result[0].activity_type).toBe('vocalizing_at_objects');
    expect(result[1].activity_type).toBe('sudden_zoomies');
  });

  it('should filter activities by cat_id correctly', async () => {
    // Create two test cat profiles
    const cat1Result = await db.insert(catProfilesTable)
      .values({
        name: 'Cat1',
        breed: 'Persian',
        color: 'white',
        age_years: 4,
        suspicion_level: 'low'
      })
      .returning()
      .execute();

    const cat2Result = await db.insert(catProfilesTable)
      .values({
        name: 'Cat2',
        breed: 'Siamese',
        color: 'brown',
        age_years: 2,
        suspicion_level: 'high'
      })
      .returning()
      .execute();

    const cat1Id = cat1Result[0].id;
    const cat2Id = cat2Result[0].id;

    // Create activities for both cats in the same date range
    const activities = [
      {
        cat_id: cat1Id,
        activity_type: 'sitting_in_boxes' as const,
        description: 'Cat1 activity',
        conspiracy_points: 2,
        occurred_at: new Date('2024-01-15T10:00:00Z')
      },
      {
        cat_id: cat2Id,
        activity_type: 'hiding_under_furniture' as const,
        description: 'Cat2 activity',
        conspiracy_points: 7,
        occurred_at: new Date('2024-01-15T11:00:00Z')
      }
    ];

    await db.insert(catActivityLogsTable)
      .values(activities)
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      cat_id: cat1Id,
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    };

    const result = await getCatActivities(input);

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toBe(cat1Id);
    expect(result[0].activity_type).toBe('sitting_in_boxes');
    expect(result[0].description).toBe('Cat1 activity');
  });

  it('should handle edge case with boundary dates correctly', async () => {
    // Create test cat profile
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'EdgeCase',
        breed: null,
        color: null,
        age_years: null,
        suspicion_level: 'medium'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;

    // Create activities exactly at the boundary times
    const activities = [
      {
        cat_id: catId,
        activity_type: 'suspicious_purring' as const,
        description: 'Start of day activity',
        conspiracy_points: 5,
        occurred_at: new Date('2024-01-15T00:00:00Z') // Exactly start of day
      },
      {
        cat_id: catId,
        activity_type: 'ignoring_humans' as const,
        description: 'End of day activity',
        conspiracy_points: 3,
        occurred_at: new Date('2024-01-15T23:59:59Z') // End of day
      },
      {
        cat_id: catId,
        activity_type: 'prolonged_staring' as const,
        description: 'Next day activity',
        conspiracy_points: 4,
        occurred_at: new Date('2024-01-16T00:00:01Z') // Just after range
      }
    ];

    await db.insert(catActivityLogsTable)
      .values(activities)
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      cat_id: catId,
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    };

    const result = await getCatActivities(input);

    // Should include activities from exactly the start and end of the day
    expect(result).toHaveLength(2);
    
    const activityTypes = result.map(a => a.activity_type).sort();
    expect(activityTypes).toEqual(['ignoring_humans', 'suspicious_purring']);
  });
});
