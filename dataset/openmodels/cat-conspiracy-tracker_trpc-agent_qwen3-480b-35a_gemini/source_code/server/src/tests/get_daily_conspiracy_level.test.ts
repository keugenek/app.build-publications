import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { getDailyConspiracyLevel } from '../handlers/get_daily_conspiracy_level';
import { eq } from 'drizzle-orm';

describe('getDailyConspiracyLevel', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(suspiciousActivitiesTable).values([
      {
        description: 'Cat stared at me for 10 minutes straight',
        activity_type: 'PROLONGED_STARE',
        conspiracy_points: 25,
        recorded_at: today,
        created_at: new Date()
      },
      {
        description: 'Cat brought me a "gift"',
        activity_type: 'GIFT_BRINGING',
        conspiracy_points: 15,
        recorded_at: today,
        created_at: new Date()
      },
      {
        description: 'Cat knocked things off counter',
        activity_type: 'KNOCKING_THINGS_OFF_COUNTERS',
        conspiracy_points: 10,
        recorded_at: yesterday,
        created_at: new Date()
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should calculate the correct conspiracy level for a date with activities', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to midday to avoid time comparison issues
    
    const result = await getDailyConspiracyLevel(today);
    
    expect(result.date).toEqual(today);
    expect(result.total_points).toBe(40); // 25 + 15
    expect(result.activity_count).toBe(2);
  });

  it('should return zero values for a date with no activities', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const result = await getDailyConspiracyLevel(futureDate);
    
    expect(result.date).toEqual(futureDate);
    expect(result.total_points).toBe(0);
    expect(result.activity_count).toBe(0);
  });

  it('should correctly filter activities by date boundaries', async () => {
    // Test that activities from other dates are not included
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    
    const result = await getDailyConspiracyLevel(yesterday);
    
    expect(result.date).toEqual(yesterday);
    expect(result.total_points).toBe(10); // Only the activity from yesterday
    expect(result.activity_count).toBe(1);
  });

  it('should save data to database correctly', async () => {
    const today = new Date();
    
    // Query using proper drizzle syntax to verify data was saved
    const activities = await db.select()
      .from(suspiciousActivitiesTable)
      .where(eq(suspiciousActivitiesTable.activity_type, 'PROLONGED_STARE'))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].description).toEqual('Cat stared at me for 10 minutes straight');
    expect(activities[0].conspiracy_points).toEqual(25);
  });
});
