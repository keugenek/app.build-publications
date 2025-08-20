import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { getActivityTypes } from '../handlers/get_activity_types';

describe('getActivityTypes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activity types exist', async () => {
    const result = await getActivityTypes();
    expect(result).toEqual([]);
  });

  it('should return all activity types ordered by creation date (newest first)', async () => {
    // Create test activity types in sequence
    const firstActivity = await db.insert(activityTypesTable)
      .values({
        name: 'Prolonged Staring',
        description: 'Cat stares intensely at humans',
        suspicion_points: 3
      })
      .returning()
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const secondActivity = await db.insert(activityTypesTable)
      .values({
        name: 'Knocking Items Off Shelves',
        description: 'Deliberately pushing items off surfaces',
        suspicion_points: 5
      })
      .returning()
      .execute();

    const result = await getActivityTypes();

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].name).toEqual('Knocking Items Off Shelves');
    expect(result[0].description).toEqual('Deliberately pushing items off surfaces');
    expect(result[0].suspicion_points).toEqual(5);
    expect(result[0].id).toEqual(secondActivity[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Prolonged Staring');
    expect(result[1].description).toEqual('Cat stares intensely at humans');
    expect(result[1].suspicion_points).toEqual(3);
    expect(result[1].id).toEqual(firstActivity[0].id);
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify ordering - newer should come first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle activity types with null descriptions', async () => {
    await db.insert(activityTypesTable)
      .values({
        name: 'Mysterious Activity',
        description: null,
        suspicion_points: 2
      })
      .execute();

    const result = await getActivityTypes();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Mysterious Activity');
    expect(result[0].description).toBeNull();
    expect(result[0].suspicion_points).toEqual(2);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple activity types with various suspicion points', async () => {
    const testData = [
      { name: 'Low Suspicion Activity', description: 'Minor suspicious behavior', suspicion_points: 1 },
      { name: 'Medium Suspicion Activity', description: 'Moderately suspicious behavior', suspicion_points: 5 },
      { name: 'High Suspicion Activity', description: 'Highly suspicious behavior', suspicion_points: 10 }
    ];

    // Insert all test data
    for (const data of testData) {
      await db.insert(activityTypesTable)
        .values(data)
        .execute();
      // Small delay between insertions to ensure distinct timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const result = await getActivityTypes();

    expect(result).toHaveLength(3);
    
    // Verify all records are returned with correct data types
    result.forEach(activityType => {
      expect(typeof activityType.id).toEqual('number');
      expect(typeof activityType.name).toEqual('string');
      expect(typeof activityType.suspicion_points).toEqual('number');
      expect(activityType.created_at).toBeInstanceOf(Date);
      
      // Description can be string or null
      if (activityType.description !== null) {
        expect(typeof activityType.description).toEqual('string');
      }
    });

    // Should be ordered by creation date (newest first)
    // So the last inserted item should be first
    expect(result[0].name).toEqual('High Suspicion Activity');
    expect(result[1].name).toEqual('Medium Suspicion Activity');
    expect(result[2].name).toEqual('Low Suspicion Activity');
  });

  it('should handle large numbers of activity types', async () => {
    // Create 10 activity types
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push(
        db.insert(activityTypesTable)
          .values({
            name: `Activity ${i}`,
            description: `Description for activity ${i}`,
            suspicion_points: i
          })
          .execute()
      );
    }

    await Promise.all(promises);

    const result = await getActivityTypes();

    expect(result).toHaveLength(10);
    
    // Verify all have correct structure
    result.forEach(activityType => {
      expect(activityType.id).toBeDefined();
      expect(activityType.name).toMatch(/^Activity \d+$/);
      expect(activityType.description).toMatch(/^Description for activity \d+$/);
      expect(activityType.suspicion_points).toBeGreaterThanOrEqual(1);
      expect(activityType.suspicion_points).toBeLessThanOrEqual(10);
      expect(activityType.created_at).toBeInstanceOf(Date);
    });
  });
});
