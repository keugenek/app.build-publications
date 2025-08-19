import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { type CreateCatActivityInput } from '../schema';
import { createCatActivity } from '../handlers/create_cat_activity';
import { eq, and, gte, lte } from 'drizzle-orm';

describe('createCatActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testBehaviorTypeId: number;

  beforeEach(async () => {
    // Create a test behavior type first
    const behaviorTypeResult = await db.insert(behaviorTypesTable)
      .values({
        name: 'Staring Intensely',
        conspiracy_score: 7,
        is_custom: false
      })
      .returning()
      .execute();
    
    testBehaviorTypeId = behaviorTypeResult[0].id;
  });

  const testInput: CreateCatActivityInput = {
    behavior_type_id: 0, // Will be set in beforeEach
    description: 'Cat was staring at the wall for 10 minutes straight',
    cat_name: 'Whiskers',
    activity_date: new Date('2024-01-15T14:30:00Z')
  };

  it('should create a cat activity', async () => {
    const input = { ...testInput, behavior_type_id: testBehaviorTypeId };
    const result = await createCatActivity(input);

    expect(result.id).toBeDefined();
    expect(result.behavior_type_id).toEqual(testBehaviorTypeId);
    expect(result.description).toEqual('Cat was staring at the wall for 10 minutes straight');
    expect(result.cat_name).toEqual('Whiskers');
    expect(result.activity_date).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity to database', async () => {
    const input = { ...testInput, behavior_type_id: testBehaviorTypeId };
    const result = await createCatActivity(input);

    const activities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].behavior_type_id).toEqual(testBehaviorTypeId);
    expect(activities[0].description).toEqual('Cat was staring at the wall for 10 minutes straight');
    expect(activities[0].cat_name).toEqual('Whiskers');
    expect(activities[0].activity_date).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should create activity with null cat_name', async () => {
    const input = { 
      ...testInput, 
      behavior_type_id: testBehaviorTypeId,
      cat_name: null 
    };
    const result = await createCatActivity(input);

    expect(result.cat_name).toBeNull();

    const activities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, result.id))
      .execute();

    expect(activities[0].cat_name).toBeNull();
  });

  it('should create daily conspiracy level for new date', async () => {
    const input = { ...testInput, behavior_type_id: testBehaviorTypeId };
    await createCatActivity(input);

    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(1);
    expect(dailyLevels[0].total_conspiracy_score).toEqual(7); // Score from behavior type
    expect(dailyLevels[0].activity_count).toEqual(1);
    expect(dailyLevels[0].created_at).toBeInstanceOf(Date);
    expect(dailyLevels[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing daily conspiracy level', async () => {
    // Create initial daily conspiracy level
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: '2024-01-15',
        total_conspiracy_score: 5,
        activity_count: 1
      })
      .execute();

    // Add activity for the same date
    const input = { ...testInput, behavior_type_id: testBehaviorTypeId };
    await createCatActivity(input);

    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(1);
    expect(dailyLevels[0].total_conspiracy_score).toEqual(7); // Recalculated from all activities
    expect(dailyLevels[0].activity_count).toEqual(1); // Only our new activity exists
    expect(dailyLevels[0].updated_at).toBeInstanceOf(Date);
  });

  it('should accumulate multiple activities on same date', async () => {
    // Create another behavior type
    const anotherBehaviorType = await db.insert(behaviorTypesTable)
      .values({
        name: 'Knocking Things Off',
        conspiracy_score: 3,
        is_custom: false
      })
      .returning()
      .execute();

    const input1 = { ...testInput, behavior_type_id: testBehaviorTypeId };
    const input2 = { 
      ...testInput, 
      behavior_type_id: anotherBehaviorType[0].id,
      description: 'Knocked my phone off the table'
    };

    // Create two activities on the same date
    await createCatActivity(input1);
    await createCatActivity(input2);

    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(1);
    expect(dailyLevels[0].total_conspiracy_score).toEqual(10); // 7 + 3
    expect(dailyLevels[0].activity_count).toEqual(2);
  });

  it('should handle activities on different dates separately', async () => {
    const input1 = { ...testInput, behavior_type_id: testBehaviorTypeId };
    const input2 = { 
      ...testInput, 
      behavior_type_id: testBehaviorTypeId,
      activity_date: new Date('2024-01-16T14:30:00Z')
    };

    await createCatActivity(input1);
    await createCatActivity(input2);

    const date1Levels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    const date2Levels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-16'))
      .execute();

    expect(date1Levels).toHaveLength(1);
    expect(date1Levels[0].total_conspiracy_score).toEqual(7);
    expect(date1Levels[0].activity_count).toEqual(1);

    expect(date2Levels).toHaveLength(1);
    expect(date2Levels[0].total_conspiracy_score).toEqual(7);
    expect(date2Levels[0].activity_count).toEqual(1);
  });

  it('should handle activities at different times on same date', async () => {
    const input1 = { 
      ...testInput, 
      behavior_type_id: testBehaviorTypeId,
      activity_date: new Date('2024-01-15T09:00:00Z') // Morning
    };
    const input2 = { 
      ...testInput, 
      behavior_type_id: testBehaviorTypeId,
      description: 'Evening staring session',
      activity_date: new Date('2024-01-15T21:00:00Z') // Evening
    };

    await createCatActivity(input1);
    await createCatActivity(input2);

    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, '2024-01-15'))
      .execute();

    expect(dailyLevels).toHaveLength(1);
    expect(dailyLevels[0].total_conspiracy_score).toEqual(14); // 7 + 7
    expect(dailyLevels[0].activity_count).toEqual(2);
  });

  it('should throw error for non-existent behavior type', async () => {
    const input = { 
      ...testInput, 
      behavior_type_id: 99999 // Non-existent ID
    };

    await expect(createCatActivity(input)).rejects.toThrow(/Behavior type with id 99999 does not exist/i);
  });

  it('should not create activity if behavior type validation fails', async () => {
    const input = { 
      ...testInput, 
      behavior_type_id: 99999 // Non-existent ID
    };

    try {
      await createCatActivity(input);
    } catch (error) {
      // Expected error
    }

    // Verify no activity was created
    const activities = await db.select()
      .from(catActivitiesTable)
      .execute();

    expect(activities).toHaveLength(0);

    // Verify no daily conspiracy level was created
    const dailyLevels = await db.select()
      .from(dailyConspiracyLevelsTable)
      .execute();

    expect(dailyLevels).toHaveLength(0);
  });
});
