import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activityTypesTable, suspiciousActivitiesTable } from '../db/schema';
import { getSuspiciousActivities } from '../handlers/get_suspicious_activities';

describe('getSuspiciousActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    const result = await getSuspiciousActivities();
    expect(result).toEqual([]);
  });

  it('should return all activities with expanded details', async () => {
    // Create test cat
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Whiskers',
        description: 'Suspicious feline'
      })
      .returning()
      .execute();
    const catId = catResult[0].id;

    // Create test activity type
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Prolonged Staring',
        description: 'Staring at humans for extended periods',
        suspicion_points: 5
      })
      .returning()
      .execute();
    const activityTypeId = activityTypeResult[0].id;

    // Create test suspicious activity
    const activityResult = await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: catId,
        activity_type_id: activityTypeId,
        notes: 'Stared at me for 10 minutes straight',
        activity_date: '2024-01-15'
      })
      .returning()
      .execute();

    const result = await getSuspiciousActivities();

    expect(result).toHaveLength(1);
    
    const activity = result[0];
    expect(activity.id).toEqual(activityResult[0].id);
    expect(activity.cat_id).toEqual(catId);
    expect(activity.activity_type_id).toEqual(activityTypeId);
    expect(activity.notes).toEqual('Stared at me for 10 minutes straight');
    expect(activity.activity_date).toEqual('2024-01-15');
    expect(activity.activity_name).toEqual('Prolonged Staring');
    expect(activity.activity_description).toEqual('Staring at humans for extended periods');
    expect(activity.suspicion_points).toEqual(5);
    expect(activity.logged_at).toBeInstanceOf(Date);
  });

  it('should filter activities by cat ID', async () => {
    // Create two test cats
    const cat1Result = await db.insert(catsTable)
      .values({ name: 'Cat 1', description: null })
      .returning()
      .execute();
    const cat1Id = cat1Result[0].id;

    const cat2Result = await db.insert(catsTable)
      .values({ name: 'Cat 2', description: null })
      .returning()
      .execute();
    const cat2Id = cat2Result[0].id;

    // Create activity type
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Knocking Items',
        description: 'Pushing items off surfaces',
        suspicion_points: 3
      })
      .returning()
      .execute();
    const activityTypeId = activityTypeResult[0].id;

    // Create activities for both cats
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: cat1Id,
          activity_type_id: activityTypeId,
          notes: 'Knocked over a glass',
          activity_date: '2024-01-15'
        },
        {
          cat_id: cat2Id,
          activity_type_id: activityTypeId,
          notes: 'Knocked over a book',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    // Filter by cat1 ID
    const result = await getSuspiciousActivities(cat1Id);

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toEqual(cat1Id);
    expect(result[0].notes).toEqual('Knocked over a glass');
    expect(result[0].activity_name).toEqual('Knocking Items');
    expect(result[0].suspicion_points).toEqual(3);
  });

  it('should filter activities by date', async () => {
    // Create test cat
    const catResult = await db.insert(catsTable)
      .values({ name: 'Test Cat', description: null })
      .returning()
      .execute();
    const catId = catResult[0].id;

    // Create activity type
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Midnight Zoomies',
        description: 'Running around at 3 AM',
        suspicion_points: 7
      })
      .returning()
      .execute();
    const activityTypeId = activityTypeResult[0].id;

    // Create activities on different dates
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: catId,
          activity_type_id: activityTypeId,
          notes: 'Ran around at 3 AM',
          activity_date: '2024-01-15'
        },
        {
          cat_id: catId,
          activity_type_id: activityTypeId,
          notes: 'Another midnight sprint',
          activity_date: '2024-01-16'
        }
      ])
      .execute();

    // Filter by specific date
    const result = await getSuspiciousActivities(undefined, '2024-01-15');

    expect(result).toHaveLength(1);
    expect(result[0].activity_date).toEqual('2024-01-15');
    expect(result[0].notes).toEqual('Ran around at 3 AM');
    expect(result[0].activity_name).toEqual('Midnight Zoomies');
    expect(result[0].suspicion_points).toEqual(7);
  });

  it('should filter activities by both cat ID and date', async () => {
    // Create two cats
    const cat1Result = await db.insert(catsTable)
      .values({ name: 'Cat 1', description: null })
      .returning()
      .execute();
    const cat1Id = cat1Result[0].id;

    const cat2Result = await db.insert(catsTable)
      .values({ name: 'Cat 2', description: null })
      .returning()
      .execute();
    const cat2Id = cat2Result[0].id;

    // Create activity type
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Hiding Evidence',
        description: 'Burying things in litter box',
        suspicion_points: 4
      })
      .returning()
      .execute();
    const activityTypeId = activityTypeResult[0].id;

    // Create multiple activities
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: cat1Id,
          activity_type_id: activityTypeId,
          notes: 'Buried toy mouse',
          activity_date: '2024-01-15'
        },
        {
          cat_id: cat1Id,
          activity_type_id: activityTypeId,
          notes: 'Buried hair tie',
          activity_date: '2024-01-16'
        },
        {
          cat_id: cat2Id,
          activity_type_id: activityTypeId,
          notes: 'Buried pen',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    // Filter by cat1 ID and specific date
    const result = await getSuspiciousActivities(cat1Id, '2024-01-15');

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toEqual(cat1Id);
    expect(result[0].activity_date).toEqual('2024-01-15');
    expect(result[0].notes).toEqual('Buried toy mouse');
    expect(result[0].activity_name).toEqual('Hiding Evidence');
    expect(result[0].suspicion_points).toEqual(4);
  });

  it('should handle activities with null notes and descriptions', async () => {
    // Create test cat
    const catResult = await db.insert(catsTable)
      .values({ name: 'Test Cat', description: null })
      .returning()
      .execute();
    const catId = catResult[0].id;

    // Create activity type with null description
    const activityTypeResult = await db.insert(activityTypesTable)
      .values({
        name: 'Mystery Activity',
        description: null,
        suspicion_points: 2
      })
      .returning()
      .execute();
    const activityTypeId = activityTypeResult[0].id;

    // Create activity with null notes
    await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: catId,
        activity_type_id: activityTypeId,
        notes: null,
        activity_date: '2024-01-15'
      })
      .execute();

    const result = await getSuspiciousActivities();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].activity_description).toBeNull();
    expect(result[0].activity_name).toEqual('Mystery Activity');
    expect(result[0].suspicion_points).toEqual(2);
  });

  it('should return multiple activities sorted properly', async () => {
    // Create test cat
    const catResult = await db.insert(catsTable)
      .values({ name: 'Multi-Activity Cat', description: null })
      .returning()
      .execute();
    const catId = catResult[0].id;

    // Create multiple activity types
    const activityType1Result = await db.insert(activityTypesTable)
      .values({
        name: 'Plotting',
        description: 'Planning world domination',
        suspicion_points: 10
      })
      .returning()
      .execute();

    const activityType2Result = await db.insert(activityTypesTable)
      .values({
        name: 'Surveillance',
        description: 'Watching from high places',
        suspicion_points: 6
      })
      .returning()
      .execute();

    // Create multiple activities
    await db.insert(suspiciousActivitiesTable)
      .values([
        {
          cat_id: catId,
          activity_type_id: activityType1Result[0].id,
          notes: 'Meowing at empty corners',
          activity_date: '2024-01-15'
        },
        {
          cat_id: catId,
          activity_type_id: activityType2Result[0].id,
          notes: 'Perched on bookshelf for hours',
          activity_date: '2024-01-15'
        }
      ])
      .execute();

    const result = await getSuspiciousActivities();

    expect(result).toHaveLength(2);
    
    // Verify both activities are returned with correct expanded details
    const plottingActivity = result.find(a => a.activity_name === 'Plotting');
    const surveillanceActivity = result.find(a => a.activity_name === 'Surveillance');

    expect(plottingActivity).toBeDefined();
    expect(plottingActivity!.suspicion_points).toEqual(10);
    expect(plottingActivity!.activity_description).toEqual('Planning world domination');

    expect(surveillanceActivity).toBeDefined();
    expect(surveillanceActivity!.suspicion_points).toEqual(6);
    expect(surveillanceActivity!.activity_description).toEqual('Watching from high places');
  });
});
