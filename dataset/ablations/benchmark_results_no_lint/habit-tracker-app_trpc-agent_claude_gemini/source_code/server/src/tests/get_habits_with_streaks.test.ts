import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { getHabitsWithStreaks } from '../handlers/get_habits_with_streaks';

describe('getHabitsWithStreaks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabitsWithStreaks();
    
    expect(result).toEqual([]);
  });

  it('should return habits with zero streak when no check-ins exist', async () => {
    // Create test habits
    const habits = await db.insert(habitsTable)
      .values([
        { name: 'Exercise', description: 'Daily workout' },
        { name: 'Reading', description: null }
      ])
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(2);
    
    const exercise = result.find(h => h.name === 'Exercise');
    expect(exercise).toBeDefined();
    expect(exercise!.current_streak).toBe(0);
    expect(exercise!.last_completed).toBeNull();
    expect(exercise!.description).toBe('Daily workout');
    
    const reading = result.find(h => h.name === 'Reading');
    expect(reading).toBeDefined();
    expect(reading!.current_streak).toBe(0);
    expect(reading!.last_completed).toBeNull();
    expect(reading!.description).toBeNull();
  });

  it('should calculate correct streak for consecutive days', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({ name: 'Exercise', description: 'Daily workout' })
      .returning()
      .execute();

    // Create check-ins for 3 consecutive days (today, yesterday, day before)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    await db.insert(habitCheckInsTable)
      .values([
        { habit_id: habit.id, completed_at: today },
        { habit_id: habit.id, completed_at: yesterday },
        { habit_id: habit.id, completed_at: dayBefore }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(3);
    expect(result[0].last_completed).toEqual(today);
  });

  it('should handle gaps in check-ins correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({ name: 'Exercise', description: 'Daily workout' })
      .returning()
      .execute();

    // Create check-ins with a gap: today, yesterday, then skip a day, then check-in
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.insert(habitCheckInsTable)
      .values([
        { habit_id: habit.id, completed_at: today },
        { habit_id: habit.id, completed_at: yesterday },
        { habit_id: habit.id, completed_at: threeDaysAgo }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2); // Only today and yesterday count
    expect(result[0].last_completed).toEqual(today);
  });

  it('should handle multiple check-ins on the same day', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({ name: 'Exercise', description: 'Daily workout' })
      .returning()
      .execute();

    // Create multiple check-ins on the same day
    const today = new Date();
    const todayMorning = new Date(today);
    todayMorning.setHours(8, 0, 0, 0);
    const todayEvening = new Date(today);
    todayEvening.setHours(20, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(habitCheckInsTable)
      .values([
        { habit_id: habit.id, completed_at: todayMorning },
        { habit_id: habit.id, completed_at: todayEvening },
        { habit_id: habit.id, completed_at: yesterday }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2); // Two distinct days
    // Should use the latest check-in time as last_completed
    expect(result[0].last_completed!.getTime()).toBeGreaterThan(todayMorning.getTime());
  });

  it('should handle single day streak correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({ name: 'Reading', description: null })
      .returning()
      .execute();

    // Create only one check-in for today
    const today = new Date();
    await db.insert(habitCheckInsTable)
      .values({ habit_id: habit.id, completed_at: today })
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1);
    expect(result[0].last_completed).toEqual(today);
  });

  it('should return multiple habits with different streaks', async () => {
    // Create multiple habits
    const habits = await db.insert(habitsTable)
      .values([
        { name: 'Exercise', description: 'Daily workout' },
        { name: 'Reading', description: 'Read books' },
        { name: 'Meditation', description: null }
      ])
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Exercise: 2-day streak
    await db.insert(habitCheckInsTable)
      .values([
        { habit_id: habits[0].id, completed_at: today },
        { habit_id: habits[0].id, completed_at: yesterday }
      ])
      .execute();

    // Reading: 1-day streak (only today)
    await db.insert(habitCheckInsTable)
      .values({ habit_id: habits[1].id, completed_at: today })
      .execute();

    // Meditation: no check-ins

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(3);

    const exercise = result.find(h => h.name === 'Exercise');
    expect(exercise!.current_streak).toBe(2);
    expect(exercise!.last_completed).toEqual(today);

    const reading = result.find(h => h.name === 'Reading');
    expect(reading!.current_streak).toBe(1);
    expect(reading!.last_completed).toEqual(today);

    const meditation = result.find(h => h.name === 'Meditation');
    expect(meditation!.current_streak).toBe(0);
    expect(meditation!.last_completed).toBeNull();
  });

  it('should handle old check-ins that do not contribute to current streak', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({ name: 'Exercise', description: 'Daily workout' })
      .returning()
      .execute();

    // Create check-ins: today, then a gap, then some old check-ins
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    await db.insert(habitCheckInsTable)
      .values([
        { habit_id: habit.id, completed_at: today },
        { habit_id: habit.id, completed_at: oneWeekAgo },
        { habit_id: habit.id, completed_at: twoWeeksAgo }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1); // Only today counts due to gap
    expect(result[0].last_completed).toEqual(today);
  });
});
