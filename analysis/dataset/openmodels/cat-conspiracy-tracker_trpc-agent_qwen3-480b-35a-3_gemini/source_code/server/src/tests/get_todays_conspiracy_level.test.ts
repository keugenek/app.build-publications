import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { getTodaysConspiracyLevel } from '../handlers/get_todays_conspiracy_level';
import { eq } from 'drizzle-orm';

describe('getTodaysConspiracyLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero conspiracy level when no activities exist', async () => {
    const result = await getTodaysConspiracyLevel();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    expect(result.date).toEqual(today);
    expect(result.total_suspicion_score).toBe(0);
  });

  it('should calculate correct conspiracy level for today\'s activities', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Format dates as YYYY-MM-DD strings
    const todayString = today.toISOString().split('T')[0];
    
    // Insert some test activities for today
    await db.insert(activitiesTable).values([
      {
        description: 'Staring intently at the wall',
        suspicion_score: 5,
        activity_type: 'Prolonged Staring',
        date: todayString
      },
      {
        description: 'Running around at 3am',
        suspicion_score: 10,
        activity_type: 'Midnight Zoomies',
        date: todayString
      }
    ]).execute();
    
    const result = await getTodaysConspiracyLevel();
    
    expect(result.date).toEqual(today);
    expect(result.total_suspicion_score).toBe(15); // 5 + 10
  });

  it('should only include today\'s activities in calculation', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates as YYYY-MM-DD strings
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Insert activities for both today and yesterday
    await db.insert(activitiesTable).values([
      {
        description: 'Staring intently at the wall',
        suspicion_score: 5,
        activity_type: 'Prolonged Staring',
        date: todayString
      },
      {
        description: 'Yesterday\'s suspicious behavior',
        suspicion_score: 20,
        activity_type: 'Silent Judgment',
        date: yesterdayString
      }
    ]).execute();
    
    const result = await getTodaysConspiracyLevel();
    
    // Should only count today's activity (5), not yesterday's (20)
    expect(result.date).toEqual(today);
    expect(result.total_suspicion_score).toBe(5);
  });

  it('should handle empty activity list gracefully', async () => {
    // Ensure no activities exist
    await db.delete(activitiesTable).execute();
    
    const result = await getTodaysConspiracyLevel();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    expect(result.date).toEqual(today);
    expect(result.total_suspicion_score).toBe(0);
  });
});
