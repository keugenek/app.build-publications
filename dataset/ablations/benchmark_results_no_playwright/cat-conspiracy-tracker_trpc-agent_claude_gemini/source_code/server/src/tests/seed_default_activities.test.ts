import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { seedDefaultActivities } from '../handlers/seed_default_activities';
import { eq } from 'drizzle-orm';

describe('seedDefaultActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed all default activities when database is empty', async () => {
    const result = await seedDefaultActivities();

    expect(result).toHaveLength(10);
    
    // Verify specific activities are present
    const staringActivity = result.find(activity => activity.name === 'Prolonged Staring');
    expect(staringActivity).toBeDefined();
    expect(staringActivity?.description).toEqual('Cat stares intensely at nothing visible to humans');
    expect(staringActivity?.suspicion_points).toEqual(5);
    expect(staringActivity?.id).toBeDefined();
    expect(staringActivity?.created_at).toBeInstanceOf(Date);

    const giftActivity = result.find(activity => activity.name === 'Leaving Dead Insect Gifts');
    expect(giftActivity).toBeDefined();
    expect(giftActivity?.suspicion_points).toEqual(8);

    const preyActivity = result.find(activity => activity.name === 'Bringing Live Prey Indoors');
    expect(preyActivity).toBeDefined();
    expect(preyActivity?.suspicion_points).toEqual(12);
  });

  it('should save all activities to the database', async () => {
    await seedDefaultActivities();

    const allActivities = await db.select()
      .from(activityTypesTable)
      .execute();

    expect(allActivities).toHaveLength(10);

    // Verify database contains expected activities
    const activityNames = allActivities.map(activity => activity.name);
    expect(activityNames).toContain('Prolonged Staring');
    expect(activityNames).toContain('3 AM Vocalizations');
    expect(activityNames).toContain('Bringing Live Prey Indoors');
    expect(activityNames).toContain('Sitting on Important Documents');
  });

  it('should not create duplicates when run multiple times', async () => {
    // Run seeding twice
    const firstRun = await seedDefaultActivities();
    const secondRun = await seedDefaultActivities();

    // Both runs should return the same activities
    expect(firstRun).toHaveLength(10);
    expect(secondRun).toHaveLength(10);

    // Database should still only have 10 activities
    const allActivities = await db.select()
      .from(activityTypesTable)
      .execute();

    expect(allActivities).toHaveLength(10);

    // Verify IDs are the same (no duplicates created)
    const firstRunIds = firstRun.map(a => a.id).sort();
    const secondRunIds = secondRun.map(a => a.id).sort();
    expect(firstRunIds).toEqual(secondRunIds);
  });

  it('should handle partial existing data correctly', async () => {
    // Manually insert one activity first
    await db.insert(activityTypesTable)
      .values({
        name: 'Prolonged Staring',
        description: 'Existing activity',
        suspicion_points: 10
      })
      .execute();

    const result = await seedDefaultActivities();

    expect(result).toHaveLength(10);

    // Verify the pre-existing activity is returned as-is
    const existingActivity = result.find(activity => activity.name === 'Prolonged Staring');
    expect(existingActivity).toBeDefined();
    expect(existingActivity?.description).toEqual('Existing activity'); // Should keep original
    expect(existingActivity?.suspicion_points).toEqual(10); // Should keep original

    // Verify other activities were still created
    const newActivity = result.find(activity => activity.name === 'Knocking Items Off Shelves');
    expect(newActivity).toBeDefined();
    expect(newActivity?.suspicion_points).toEqual(6);
  });

  it('should return activities with all required fields', async () => {
    const result = await seedDefaultActivities();

    result.forEach(activity => {
      expect(activity.id).toBeDefined();
      expect(typeof activity.id).toBe('number');
      expect(activity.name).toBeDefined();
      expect(typeof activity.name).toBe('string');
      expect(activity.description).toBeDefined(); // All default activities have descriptions
      expect(typeof activity.description).toBe('string');
      expect(activity.suspicion_points).toBeDefined();
      expect(typeof activity.suspicion_points).toBe('number');
      expect(activity.created_at).toBeInstanceOf(Date);
    });
  });

  it('should verify specific suspicion point values', async () => {
    const result = await seedDefaultActivities();

    const expectedValues = [
      { name: 'Prolonged Staring', points: 5 },
      { name: 'Leaving Dead Insect Gifts', points: 8 },
      { name: 'Knocking Items Off Shelves', points: 6 },
      { name: 'Sudden Inexplicable Zoomies', points: 4 },
      { name: 'Suspicious Purring While Being Petted', points: 3 },
      { name: 'Deliberately Ignoring Commands', points: 7 },
      { name: '3 AM Vocalizations', points: 9 },
      { name: 'Hiding in Cardboard Boxes', points: 5 },
      { name: 'Bringing Live Prey Indoors', points: 12 },
      { name: 'Sitting on Important Documents', points: 4 }
    ];

    expectedValues.forEach(expected => {
      const activity = result.find(a => a.name === expected.name);
      expect(activity).toBeDefined();
      expect(activity?.suspicion_points).toEqual(expected.points);
    });
  });
});
