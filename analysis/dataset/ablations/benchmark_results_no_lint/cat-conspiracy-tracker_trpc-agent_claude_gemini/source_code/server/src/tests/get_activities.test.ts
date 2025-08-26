import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activitiesTable } from '../db/schema';
import { getActivities } from '../handlers/get_activities';

describe('getActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all activities when no catId is provided', async () => {
    // Create test cats
    const catResults = await db.insert(catsTable)
      .values([
        { name: 'Whiskers', breed: 'Maine Coon', age: 3, description: 'Very suspicious' },
        { name: 'Shadow', breed: 'Black Cat', age: 2, description: 'Plotting something' }
      ])
      .returning()
      .execute();

    const cat1Id = catResults[0].id;
    const cat2Id = catResults[1].id;

    // Create test activities for both cats
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: cat1Id,
          activity_type: 'prolonged staring',
          description: 'Staring at wall for 30 minutes',
          conspiracy_score: 7,
          recorded_at: new Date('2024-01-01T10:00:00Z')
        },
        {
          cat_id: cat1Id,
          activity_type: 'gifting dead insects',
          description: 'Left a beetle on the pillow',
          conspiracy_score: 5,
          recorded_at: new Date('2024-01-01T14:00:00Z')
        },
        {
          cat_id: cat2Id,
          activity_type: 'midnight zoomies',
          description: 'Running around at 3 AM',
          conspiracy_score: 8,
          recorded_at: new Date('2024-01-01T03:00:00Z')
        }
      ])
      .execute();

    // Get all activities
    const results = await getActivities();

    expect(results).toHaveLength(3);
    
    // Verify the activities have correct structure and types
    const activity1 = results.find(a => a.activity_type === 'prolonged staring');
    expect(activity1).toBeDefined();
    expect(activity1!.cat_id).toEqual(cat1Id);
    expect(activity1!.conspiracy_score).toEqual(7);
    expect(typeof activity1!.conspiracy_score).toEqual('number');
    expect(activity1!.recorded_at).toBeInstanceOf(Date);
    expect(activity1!.created_at).toBeInstanceOf(Date);
    expect(activity1!.description).toEqual('Staring at wall for 30 minutes');

    // Verify all cats' activities are included
    const cat1Activities = results.filter(a => a.cat_id === cat1Id);
    const cat2Activities = results.filter(a => a.cat_id === cat2Id);
    expect(cat1Activities).toHaveLength(2);
    expect(cat2Activities).toHaveLength(1);
  });

  it('should return activities for specific cat when catId is provided', async () => {
    // Create test cats
    const catResults = await db.insert(catsTable)
      .values([
        { name: 'Mittens', breed: 'Persian', age: 5, description: 'Master of disguise' },
        { name: 'Tiger', breed: 'Tabby', age: 1, description: 'Innocent looking' }
      ])
      .returning()
      .execute();

    const targetCatId = catResults[0].id;
    const otherCatId = catResults[1].id;

    // Create activities for both cats
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: targetCatId,
          activity_type: 'knocking things off tables',
          description: 'Systematically clearing the coffee table',
          conspiracy_score: 9,
          recorded_at: new Date('2024-01-02T09:00:00Z')
        },
        {
          cat_id: targetCatId,
          activity_type: 'hiding behind curtains',
          description: 'Surveillance position established',
          conspiracy_score: 6,
          recorded_at: new Date('2024-01-02T11:00:00Z')
        },
        {
          cat_id: otherCatId,
          activity_type: 'sleeping all day',
          description: 'Suspiciously inactive',
          conspiracy_score: 3,
          recorded_at: new Date('2024-01-02T12:00:00Z')
        }
      ])
      .execute();

    // Get activities for specific cat
    const results = await getActivities(targetCatId);

    expect(results).toHaveLength(2);
    
    // All results should be for the target cat
    results.forEach(activity => {
      expect(activity.cat_id).toEqual(targetCatId);
    });

    // Verify specific activities are returned
    const knockingActivity = results.find(a => a.activity_type === 'knocking things off tables');
    expect(knockingActivity).toBeDefined();
    expect(knockingActivity!.conspiracy_score).toEqual(9);
    expect(knockingActivity!.description).toEqual('Systematically clearing the coffee table');

    const hidingActivity = results.find(a => a.activity_type === 'hiding behind curtains');
    expect(hidingActivity).toBeDefined();
    expect(hidingActivity!.conspiracy_score).toEqual(6);
  });

  it('should return empty array when cat has no activities', async () => {
    // Create a cat
    const catResults = await db.insert(catsTable)
      .values([
        { name: 'Lazy', breed: 'Ragdoll', age: 4, description: 'Too lazy to be suspicious' }
      ])
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Get activities for cat with no activities
    const results = await getActivities(catId);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array when no activities exist in database', async () => {
    // Don't create any activities

    // Get all activities
    const results = await getActivities();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for non-existent cat ID', async () => {
    // Create a cat and activity
    const catResults = await db.insert(catsTable)
      .values([{ name: 'Existing Cat', breed: 'Siamese', age: 2 }])
      .returning()
      .execute();

    await db.insert(activitiesTable)
      .values([
        {
          cat_id: catResults[0].id,
          activity_type: 'meowing loudly',
          conspiracy_score: 4,
          recorded_at: new Date()
        }
      ])
      .execute();

    // Try to get activities for non-existent cat
    const results = await getActivities(99999);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle activities with null descriptions', async () => {
    // Create a cat
    const catResults = await db.insert(catsTable)
      .values([{ name: 'Mysterious', breed: null, age: null }])
      .returning()
      .execute();

    // Create activity with null description
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: catResults[0].id,
          activity_type: 'unexplained behavior',
          description: null,
          conspiracy_score: 10,
          recorded_at: new Date('2024-01-03T15:00:00Z')
        }
      ])
      .execute();

    const results = await getActivities(catResults[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBeNull();
    expect(results[0].activity_type).toEqual('unexplained behavior');
    expect(results[0].conspiracy_score).toEqual(10);
  });

  it('should handle catId of 0 correctly', async () => {
    // Create test data
    const catResults = await db.insert(catsTable)
      .values([{ name: 'Regular Cat', breed: 'Mixed', age: 3 }])
      .returning()
      .execute();

    await db.insert(activitiesTable)
      .values([
        {
          cat_id: catResults[0].id,
          activity_type: 'normal cat behavior',
          conspiracy_score: 2,
          recorded_at: new Date()
        }
      ])
      .execute();

    // Test with catId 0 (which is a valid number but shouldn't match any records)
    const results = await getActivities(0);

    expect(results).toHaveLength(0);
  });
});
