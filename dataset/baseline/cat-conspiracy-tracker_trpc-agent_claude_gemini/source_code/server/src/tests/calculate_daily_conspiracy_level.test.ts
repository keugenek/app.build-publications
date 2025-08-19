import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable, catActivitiesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { calculateDailyConspiracyLevel } from '../handlers/calculate_daily_conspiracy_level';
import { eq } from 'drizzle-orm';

describe('calculateDailyConspiracyLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate conspiracy level for a date with no activities', async () => {
    const testDate = new Date('2023-10-15');
    
    const result = await calculateDailyConspiracyLevel(testDate);

    expect(result.total_conspiracy_score).toEqual(0);
    expect(result.activity_count).toEqual(0);
    expect(result.date).toEqual(testDate);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate conspiracy level for a date with single activity', async () => {
    const testDate = new Date('2023-10-15T10:00:00Z');
    
    // Create a behavior type
    const behaviorType = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Staring at wall',
        conspiracy_score: 5,
        is_custom: true
      })
      .returning()
      .execute();

    // Create an activity for the test date
    await db
      .insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType[0].id,
        description: 'Cat stared at wall for 10 minutes',
        cat_name: 'Whiskers',
        activity_date: testDate
      })
      .execute();

    const result = await calculateDailyConspiracyLevel(testDate);

    expect(result.total_conspiracy_score).toEqual(5);
    expect(result.activity_count).toEqual(1);
    expect(result.date).toEqual(new Date('2023-10-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate conspiracy level for multiple activities on same date', async () => {
    const testDate = new Date('2023-10-15');
    
    // Create behavior types
    const behaviorType1 = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Staring at wall',
        conspiracy_score: 5,
        is_custom: true
      })
      .returning()
      .execute();

    const behaviorType2 = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Knocking things off table',
        conspiracy_score: 8,
        is_custom: true
      })
      .returning()
      .execute();

    // Create activities for the same date
    await db
      .insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorType1[0].id,
          description: 'Cat stared at wall',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-15T09:00:00Z')
        },
        {
          behavior_type_id: behaviorType2[0].id,
          description: 'Cat knocked over plant',
          cat_name: 'Mittens',
          activity_date: new Date('2023-10-15T14:30:00Z')
        },
        {
          behavior_type_id: behaviorType1[0].id,
          description: 'Another wall staring incident',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-15T20:15:00Z')
        }
      ])
      .execute();

    const result = await calculateDailyConspiracyLevel(testDate);

    expect(result.total_conspiracy_score).toEqual(18); // 5 + 8 + 5
    expect(result.activity_count).toEqual(3);
    expect(result.date).toEqual(testDate);
  });

  it('should only include activities from the specified date', async () => {
    const testDate = new Date('2023-10-15');
    const otherDate = new Date('2023-10-16');
    
    // Create behavior type
    const behaviorType = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Suspicious behavior',
        conspiracy_score: 6,
        is_custom: true
      })
      .returning()
      .execute();

    // Create activities on different dates
    await db
      .insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorType[0].id,
          description: 'Activity on test date',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-15T10:00:00Z')
        },
        {
          behavior_type_id: behaviorType[0].id,
          description: 'Activity on other date',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-16T10:00:00Z')
        }
      ])
      .execute();

    const result = await calculateDailyConspiracyLevel(testDate);

    expect(result.total_conspiracy_score).toEqual(6);
    expect(result.activity_count).toEqual(1);
    expect(result.date).toEqual(testDate);
  });

  it('should update existing daily conspiracy level record', async () => {
    const testDate = new Date('2023-10-15');
    
    // Create initial behavior type and activity
    const behaviorType1 = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Initial behavior',
        conspiracy_score: 3,
        is_custom: true
      })
      .returning()
      .execute();

    await db
      .insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType1[0].id,
        description: 'Initial activity',
        cat_name: 'Whiskers',
        activity_date: testDate
      })
      .execute();

    // Calculate initial conspiracy level
    const initialResult = await calculateDailyConspiracyLevel(testDate);
    expect(initialResult.total_conspiracy_score).toEqual(3);
    expect(initialResult.activity_count).toEqual(1);

    // Add another behavior type and activity
    const behaviorType2 = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Additional behavior',
        conspiracy_score: 7,
        is_custom: true
      })
      .returning()
      .execute();

    await db
      .insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType2[0].id,
        description: 'Additional activity',
        cat_name: 'Mittens',
        activity_date: testDate
      })
      .execute();

    // Recalculate conspiracy level
    const updatedResult = await calculateDailyConspiracyLevel(testDate);
    
    expect(updatedResult.total_conspiracy_score).toEqual(10); // 3 + 7
    expect(updatedResult.activity_count).toEqual(2);
    expect(updatedResult.id).toEqual(initialResult.id); // Same record ID
    expect(updatedResult.updated_at.getTime()).toBeGreaterThan(initialResult.updated_at.getTime());
  });

  it('should save conspiracy level record to database', async () => {
    const testDate = new Date('2023-10-15');
    
    // Create behavior type and activity
    const behaviorType = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Test behavior',
        conspiracy_score: 4,
        is_custom: true
      })
      .returning()
      .execute();

    await db
      .insert(catActivitiesTable)
      .values({
        behavior_type_id: behaviorType[0].id,
        description: 'Test activity',
        cat_name: 'Whiskers',
        activity_date: testDate
      })
      .execute();

    const result = await calculateDailyConspiracyLevel(testDate);

    // Verify record exists in database
    const dbRecords = await db
      .select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.id, result.id))
      .execute();

    expect(dbRecords).toHaveLength(1);
    expect(dbRecords[0].total_conspiracy_score).toEqual(4);
    expect(dbRecords[0].activity_count).toEqual(1);
    expect(new Date(dbRecords[0].date)).toEqual(testDate);
  });

  it('should handle activities at different times of the same day', async () => {
    const testDate = new Date('2023-10-15');
    
    // Create behavior type
    const behaviorType = await db
      .insert(behaviorTypesTable)
      .values({
        name: 'Time test behavior',
        conspiracy_score: 2,
        is_custom: true
      })
      .returning()
      .execute();

    // Create activities at different times on the same date
    await db
      .insert(catActivitiesTable)
      .values([
        {
          behavior_type_id: behaviorType[0].id,
          description: 'Early morning activity',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-15T02:30:00Z')
        },
        {
          behavior_type_id: behaviorType[0].id,
          description: 'Late evening activity',
          cat_name: 'Whiskers',
          activity_date: new Date('2023-10-15T23:45:00Z')
        }
      ])
      .execute();

    const result = await calculateDailyConspiracyLevel(testDate);

    expect(result.total_conspiracy_score).toEqual(4); // 2 + 2
    expect(result.activity_count).toEqual(2);
    expect(result.date).toEqual(testDate);
  });
});
