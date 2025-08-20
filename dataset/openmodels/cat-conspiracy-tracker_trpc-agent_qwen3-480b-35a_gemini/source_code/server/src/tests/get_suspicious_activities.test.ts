import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { type CreateSuspiciousActivityInput } from '../schema';
import { getSuspiciousActivities } from '../handlers/get_suspicious_activities';
import { eq } from 'drizzle-orm';

// Test inputs for creating suspicious activities
const testActivities: CreateSuspiciousActivityInput[] = [
  {
    description: 'Cat stared at me for 10 minutes straight',
    activity_type: 'PROLONGED_STARE',
    conspiracy_points: 25
  },
  {
    description: 'Cat brought me a "gift" at 3am',
    activity_type: 'GIFT_BRINGING',
    conspiracy_points: 40
  },
  {
    description: 'Cat suddenly started purring while looking directly at the camera',
    activity_type: 'SUDDEN_PURRING',
    conspiracy_points: 15
  }
];

describe('getSuspiciousActivities', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const activity of testActivities) {
      await db.insert(suspiciousActivitiesTable)
        .values({
          ...activity,
          conspiracy_points: activity.conspiracy_points,
          recorded_at: new Date()
        })
        .execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all suspicious activities', async () => {
    const activities = await getSuspiciousActivities();

    expect(activities).toHaveLength(3);
    
    // Check that all fields are properly returned
    const firstActivity = activities[0];
    expect(firstActivity.id).toBeDefined();
    expect(firstActivity.description).toEqual(testActivities[0].description);
    expect(firstActivity.activity_type).toEqual(testActivities[0].activity_type);
    expect(firstActivity.conspiracy_points).toEqual(testActivities[0].conspiracy_points);
    expect(firstActivity.recorded_at).toBeInstanceOf(Date);
    expect(firstActivity.created_at).toBeInstanceOf(Date);
  });

  it('should return activities ordered by creation date', async () => {
    const activities = await getSuspiciousActivities();

    // Activities should be ordered by created_at (ascending by default)
    for (let i = 0; i < activities.length - 1; i++) {
      expect(activities[i].created_at.getTime()).toBeLessThanOrEqual(
        activities[i + 1].created_at.getTime()
      );
    }
  });

  it('should return empty array when no activities exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const activities = await getSuspiciousActivities();
    expect(activities).toHaveLength(0);
  });
});
