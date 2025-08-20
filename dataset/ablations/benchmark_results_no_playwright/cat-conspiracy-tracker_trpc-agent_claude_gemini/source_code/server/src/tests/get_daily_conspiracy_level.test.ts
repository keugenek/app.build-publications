import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activityTypesTable, suspiciousActivitiesTable } from '../db/schema';
import { type GetConspiracyLevelInput } from '../schema';
import { getDailyConspiracyLevel } from '../handlers/get_daily_conspiracy_level';

describe('getDailyConspiracyLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCatId: number;
  let testActivityTypeId1: number;
  let testActivityTypeId2: number;

  beforeEach(async () => {
    // Create test cat
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Whiskers',
        description: 'A very suspicious cat'
      })
      .returning()
      .execute();
    testCatId = catResult[0].id;

    // Create test activity types
    const activityType1Result = await db.insert(activityTypesTable)
      .values({
        name: 'Prolonged Staring',
        description: 'Staring intensely at humans',
        suspicion_points: 15
      })
      .returning()
      .execute();
    testActivityTypeId1 = activityType1Result[0].id;

    const activityType2Result = await db.insert(activityTypesTable)
      .values({
        name: 'Knocking Items Off',
        description: 'Deliberately knocking items off surfaces',
        suspicion_points: 25
      })
      .returning()
      .execute();
    testActivityTypeId2 = activityType2Result[0].id;
  });

  it('should return LOW conspiracy level with no activities', async () => {
    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.cat_id).toEqual(testCatId);
    expect(result.cat_name).toEqual('Whiskers');
    expect(result.date).toEqual('2024-01-15');
    expect(result.total_suspicion_points).toEqual(0);
    expect(result.activity_count).toEqual(0);
    expect(result.conspiracy_level).toEqual('LOW');
  });

  it('should calculate LOW conspiracy level (0-10 points)', async () => {
    // Create activity type with low suspicion points
    const lowActivityResult = await db.insert(activityTypesTable)
      .values({
        name: 'Mild Purring',
        description: 'Suspicious purring behavior',
        suspicion_points: 5
      })
      .returning()
      .execute();

    // Log one low-suspicion activity
    await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: testCatId,
        activity_type_id: lowActivityResult[0].id,
        notes: 'Gentle purring while plotting',
        activity_date: '2024-01-15'
      })
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(5);
    expect(result.activity_count).toEqual(1);
    expect(result.conspiracy_level).toEqual('LOW');
  });

  it('should calculate MODERATE conspiracy level (11-25 points)', async () => {
    // Log one moderate-suspicion activity
    await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: testCatId,
        activity_type_id: testActivityTypeId1, // 15 points
        notes: 'Staring at owner for 20 minutes',
        activity_date: '2024-01-15'
      })
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(15);
    expect(result.activity_count).toEqual(1);
    expect(result.conspiracy_level).toEqual('MODERATE');
  });

  it('should calculate HIGH conspiracy level (26-50 points)', async () => {
    // Log multiple activities that sum to HIGH range
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId1, // 15 points
          notes: 'First suspicious staring',
          activity_date: '2024-01-15'
        },
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId2, // 25 points
          notes: 'Knocked over water glass',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(40); // 15 + 25
    expect(result.activity_count).toEqual(2);
    expect(result.conspiracy_level).toEqual('HIGH');
  });

  it('should calculate EXTREME conspiracy level (51-100 points)', async () => {
    // Create high-suspicion activity type
    const extremeActivityResult = await db.insert(activityTypesTable)
      .values({
        name: 'World Domination Planning',
        description: 'Caught making detailed plans',
        suspicion_points: 60
      })
      .returning()
      .execute();

    await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: testCatId,
        activity_type_id: extremeActivityResult[0].id,
        notes: 'Found blueprints under cat bed',
        activity_date: '2024-01-15'
      })
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(60);
    expect(result.activity_count).toEqual(1);
    expect(result.conspiracy_level).toEqual('EXTREME');
  });

  it('should calculate WORLD_DOMINATION conspiracy level (100+ points)', async () => {
    // Create multiple high-suspicion activities
    const worldDominationActivity = await db.insert(activityTypesTable)
      .values({
        name: 'Global Cat Network Coordination',
        description: 'Coordinating with cats worldwide',
        suspicion_points: 80
      })
      .returning()
      .execute();

    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: testCatId,
          activity_type_id: worldDominationActivity[0].id, // 80 points
          notes: 'Video call with cats from other continents',
          activity_date: '2024-01-15'
        },
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId2, // 25 points
          notes: 'Strategic destruction of human belongings',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(105); // 80 + 25
    expect(result.activity_count).toEqual(2);
    expect(result.conspiracy_level).toEqual('WORLD_DOMINATION');
  });

  it('should only include activities from the specified date', async () => {
    // Log activities on different dates
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId1, // 15 points
          notes: 'Activity on target date',
          activity_date: '2024-01-15'
        },
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId2, // 25 points - should be ignored
          notes: 'Activity on different date',
          activity_date: '2024-01-16'
        }
      ])
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(15); // Only the 2024-01-15 activity
    expect(result.activity_count).toEqual(1);
    expect(result.conspiracy_level).toEqual('MODERATE');
  });

  it('should only include activities for the specified cat', async () => {
    // Create another cat
    const otherCatResult = await db.insert(catsTable)
      .values({
        name: 'Mittens',
        description: 'Another suspicious cat'
      })
      .returning()
      .execute();

    // Log activities for both cats on same date
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: testCatId,
          activity_type_id: testActivityTypeId1, // 15 points
          notes: 'Target cat activity',
          activity_date: '2024-01-15'
        },
        {
          cat_id: otherCatResult[0].id,
          activity_type_id: testActivityTypeId2, // 25 points - should be ignored
          notes: 'Other cat activity',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.cat_id).toEqual(testCatId);
    expect(result.cat_name).toEqual('Whiskers');
    expect(result.total_suspicion_points).toEqual(15); // Only testCat's activities
    expect(result.activity_count).toEqual(1);
    expect(result.conspiracy_level).toEqual('MODERATE');
  });

  it('should throw error for non-existent cat', async () => {
    const input: GetConspiracyLevelInput = {
      cat_id: 99999, // Non-existent cat ID
      date: '2024-01-15'
    };

    await expect(getDailyConspiracyLevel(input)).rejects.toThrow(/Cat with ID 99999 not found/i);
  });

  it('should handle boundary cases correctly', async () => {
    // Test exactly at boundary (11 points = MODERATE)
    const boundaryActivity = await db.insert(activityTypesTable)
      .values({
        name: 'Boundary Test Activity',
        description: 'Exactly 11 suspicion points',
        suspicion_points: 11
      })
      .returning()
      .execute();

    await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: testCatId,
        activity_type_id: boundaryActivity[0].id,
        notes: 'Boundary test',
        activity_date: '2024-01-15'
      })
      .execute();

    const input: GetConspiracyLevelInput = {
      cat_id: testCatId,
      date: '2024-01-15'
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result.total_suspicion_points).toEqual(11);
    expect(result.conspiracy_level).toEqual('MODERATE');
  });
});
