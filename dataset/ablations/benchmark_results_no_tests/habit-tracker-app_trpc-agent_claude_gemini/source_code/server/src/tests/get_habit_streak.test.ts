import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { getHabitStreak } from '../handlers/get_habit_streak';

describe('getHabitStreak', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabitId: number;

  beforeEach(async () => {
    // Create a test habit
    const result = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing streak calculation'
      })
      .returning()
      .execute();
    
    testHabitId = result[0].id;
  });

  it('should return 0 streak for habit with no tracking records', async () => {
    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(0);
  });

  it('should return 0 streak for habit with no completed days', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add incomplete tracking records
    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: testHabitId,
          date: today.toISOString().split('T')[0],
          completed: false
        }
      ])
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(0);
  });

  it('should return 1 for single completed day', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: testHabitId,
          date: today.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(1);
  });

  it('should calculate correct streak for consecutive completed days', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trackingData = [];
    
    // Create 5 consecutive completed days
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trackingData.push({
        habit_id: testHabitId,
        date: date.toISOString().split('T')[0],
        completed: true
      });
    }
    
    await db.insert(habitTrackingTable)
      .values(trackingData)
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(5);
  });

  it('should break streak at first incomplete day', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trackingData = [];
    
    // Create pattern: completed today, completed yesterday, incomplete day before
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trackingData.push({
        habit_id: testHabitId,
        date: date.toISOString().split('T')[0],
        completed: i < 2 // First 2 days completed, 3rd day incomplete
      });
    }
    
    await db.insert(habitTrackingTable)
      .values(trackingData)
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(2); // Should stop at the incomplete day
  });

  it('should break streak when there are gaps in tracking', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trackingData = [];
    
    // Create pattern: completed today, skip yesterday, completed day before yesterday
    trackingData.push({
      habit_id: testHabitId,
      date: today.toISOString().split('T')[0],
      completed: true
    });
    
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    trackingData.push({
      habit_id: testHabitId,
      date: dayBeforeYesterday.toISOString().split('T')[0],
      completed: true
    });
    
    await db.insert(habitTrackingTable)
      .values(trackingData)
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(1); // Should only count today due to gap
  });

  it('should handle mixed completed and incomplete days correctly', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trackingData = [];
    
    // Create pattern over 10 days: some completed, some not, with current streak of 3
    const pattern = [true, true, true, false, true, true, false, true, false, true]; // Most recent first
    
    for (let i = 0; i < pattern.length; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trackingData.push({
        habit_id: testHabitId,
        date: date.toISOString().split('T')[0],
        completed: pattern[i]
      });
    }
    
    await db.insert(habitTrackingTable)
      .values(trackingData)
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(3); // First 3 days are completed
  });

  it('should ignore future dates in streak calculation', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trackingData = [];
    
    // Add future date (should be ignored)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    trackingData.push({
      habit_id: testHabitId,
      date: tomorrow.toISOString().split('T')[0],
      completed: true
    });
    
    // Add today (should count)
    trackingData.push({
      habit_id: testHabitId,
      date: today.toISOString().split('T')[0],
      completed: true
    });
    
    // Add yesterday (should count)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    trackingData.push({
      habit_id: testHabitId,
      date: yesterday.toISOString().split('T')[0],
      completed: true
    });
    
    await db.insert(habitTrackingTable)
      .values(trackingData)
      .execute();

    const streak = await getHabitStreak(testHabitId);
    expect(streak).toBe(2); // Should only count today and yesterday, not tomorrow
  });

  it('should handle different habits independently', async () => {
    // Create second habit
    const result = await db.insert(habitsTable)
      .values({
        name: 'Second Habit',
        description: 'Another test habit'
      })
      .returning()
      .execute();
    
    const secondHabitId = result[0].id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First habit: 3 day streak
    const firstHabitData = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      firstHabitData.push({
        habit_id: testHabitId,
        date: date.toISOString().split('T')[0],
        completed: true
      });
    }
    
    // Second habit: 5 day streak
    const secondHabitData = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      secondHabitData.push({
        habit_id: secondHabitId,
        date: date.toISOString().split('T')[0],
        completed: true
      });
    }
    
    await db.insert(habitTrackingTable)
      .values([...firstHabitData, ...secondHabitData])
      .execute();

    const firstStreak = await getHabitStreak(testHabitId);
    const secondStreak = await getHabitStreak(secondHabitId);
    
    expect(firstStreak).toBe(3);
    expect(secondStreak).toBe(5);
  });

  it('should return 0 for non-existent habit', async () => {
    const nonExistentHabitId = 99999;
    const streak = await getHabitStreak(nonExistentHabitId);
    expect(streak).toBe(0);
  });
});
