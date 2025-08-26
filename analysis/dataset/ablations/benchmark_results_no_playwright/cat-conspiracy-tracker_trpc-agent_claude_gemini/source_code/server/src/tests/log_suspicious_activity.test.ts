import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activityTypesTable, suspiciousActivitiesTable } from '../db/schema';
import { type LogSuspiciousActivityInput } from '../schema';
import { logSuspiciousActivity } from '../handlers/log_suspicious_activity';
import { eq } from 'drizzle-orm';

describe('logSuspiciousActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should log a suspicious activity successfully', async () => {
    // Create prerequisite data
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Whiskers',
        description: 'A very suspicious cat'
      })
      .returning()
      .execute();
    const cat = catResult[0];

    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Prolonged Staring',
        description: 'Staring intensely at humans',
        suspicion_points: 5
      })
      .returning()
      .execute();
    const activityType = activityTypeResult[0];

    const testInput: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: activityType.id,
      notes: 'Stared at me for 10 minutes straight while I worked',
      activity_date: '2024-01-15'
    };

    const result = await logSuspiciousActivity(testInput);

    // Validate returned data
    expect(result.id).toBeDefined();
    expect(result.cat_id).toEqual(cat.id);
    expect(result.activity_type_id).toEqual(activityType.id);
    expect(result.notes).toEqual(testInput.notes);
    expect(result.activity_date).toEqual('2024-01-15');
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should save activity to database correctly', async () => {
    // Create prerequisite data
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Shadow',
        description: 'Black cat with mysterious intentions'
      })
      .returning()
      .execute();
    const cat = catResult[0];

    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Knocking Items Off Shelves',
        description: 'Deliberately pushing objects off surfaces',
        suspicion_points: 8
      })
      .returning()
      .execute();
    const activityType = activityTypeResult[0];

    const testInput: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: activityType.id,
      notes: 'Knocked off my coffee mug this morning',
      activity_date: '2024-01-16'
    };

    const result = await logSuspiciousActivity(testInput);

    // Verify database storage
    const activities = await db.select()
      .from(suspiciousActivitiesTable)
      .where(eq(suspiciousActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].cat_id).toEqual(cat.id);
    expect(activities[0].activity_type_id).toEqual(activityType.id);
    expect(activities[0].notes).toEqual(testInput.notes);
    expect(activities[0].activity_date).toEqual('2024-01-16');
    expect(activities[0].logged_at).toBeInstanceOf(Date);
  });

  it('should handle activities without notes', async () => {
    // Create prerequisite data
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Mittens',
        description: null
      })
      .returning()
      .execute();
    const cat = catResult[0];

    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Hiding in Boxes',
        description: 'Taking strategic positions in cardboard boxes',
        suspicion_points: 3
      })
      .returning()
      .execute();
    const activityType = activityTypeResult[0];

    const testInput: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: activityType.id,
      notes: null,
      activity_date: '2024-01-17'
    };

    const result = await logSuspiciousActivity(testInput);

    expect(result.notes).toBeNull();
    expect(result.cat_id).toEqual(cat.id);
    expect(result.activity_type_id).toEqual(activityType.id);
    expect(result.activity_date).toEqual('2024-01-17');
  });

  it('should throw error for non-existent cat', async () => {
    // Create activity type but no cat
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Midnight Zoomies',
        description: 'Running around at 3 AM',
        suspicion_points: 6
      })
      .returning()
      .execute();
    const activityType = activityTypeResult[0];

    const testInput: LogSuspiciousActivityInput = {
      cat_id: 9999, // Non-existent cat ID
      activity_type_id: activityType.id,
      notes: 'This should fail',
      activity_date: '2024-01-18'
    };

    expect(logSuspiciousActivity(testInput)).rejects.toThrow(/cat with id 9999 not found/i);
  });

  it('should throw error for non-existent activity type', async () => {
    // Create cat but no activity type
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Fluffy',
        description: 'Fluffy and suspicious'
      })
      .returning()
      .execute();
    const cat = catResult[0];

    const testInput: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: 9999, // Non-existent activity type ID
      notes: 'This should also fail',
      activity_date: '2024-01-19'
    };

    expect(logSuspiciousActivity(testInput)).rejects.toThrow(/activity type with id 9999 not found/i);
  });

  it('should handle multiple activities for the same cat on different dates', async () => {
    // Create prerequisite data
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Professor Whiskers',
        description: 'PhD in Mischief'
      })
      .returning()
      .execute();
    const cat = catResult[0];

    const activityType1Result = await db.insert(activityTypesTable)
      .values({
        name: 'Stealthy Movement',
        description: 'Moving silently through the house',
        suspicion_points: 4
      })
      .returning()
      .execute();
    const activityType1 = activityType1Result[0];

    const activityType2Result = await db.insert(activityTypesTable)
      .values({
        name: 'Surveillance',
        description: 'Watching from high places',
        suspicion_points: 7
      })
      .returning()
      .execute();
    const activityType2 = activityType2Result[0];

    // Log first activity
    const input1: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: activityType1.id,
      notes: 'Snuck into the kitchen without making a sound',
      activity_date: '2024-01-20'
    };

    // Log second activity
    const input2: LogSuspiciousActivityInput = {
      cat_id: cat.id,
      activity_type_id: activityType2.id,
      notes: 'Positioned on top of bookshelf, observing',
      activity_date: '2024-01-21'
    };

    const result1 = await logSuspiciousActivity(input1);
    const result2 = await logSuspiciousActivity(input2);

    // Both activities should be logged successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both are in database
    const allActivities = await db.select()
      .from(suspiciousActivitiesTable)
      .where(eq(suspiciousActivitiesTable.cat_id, cat.id))
      .execute();

    expect(allActivities).toHaveLength(2);
    
    const activity1 = allActivities.find(a => a.activity_date === '2024-01-20');
    const activity2 = allActivities.find(a => a.activity_date === '2024-01-21');
    
    expect(activity1).toBeDefined();
    expect(activity2).toBeDefined();
    expect(activity1!.activity_type_id).toEqual(activityType1.id);
    expect(activity2!.activity_type_id).toEqual(activityType2.id);
  });
});
