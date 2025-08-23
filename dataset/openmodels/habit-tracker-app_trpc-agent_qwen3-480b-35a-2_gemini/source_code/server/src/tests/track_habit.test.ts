import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type TrackHabitInput } from '../schema';
import { trackHabit } from '../handlers/track_habit';
import { eq, and } from 'drizzle-orm';

describe('trackHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // First create a habit to track
  const createTestHabit = async () => {
    const result = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should create a new habit tracking record', async () => {
    const habit = await createTestHabit();
    
    // Use a date string that matches what the database will return
    const testDate = new Date('2023-01-01');
    
    const input: TrackHabitInput = {
      habit_id: habit.id,
      date: testDate,
      completed: true
    };

    const result = await trackHabit(input);

    expect(result.habit_id).toEqual(habit.id);
    expect(result.date.getTime()).toEqual(testDate.getTime());
    expect(result.completed).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update an existing habit tracking record', async () => {
    const habit = await createTestHabit();
    
    const testDate = new Date('2023-01-01');
    
    const input: TrackHabitInput = {
      habit_id: habit.id,
      date: testDate,
      completed: true
    };

    // First track the habit
    await trackHabit(input);

    // Update the tracking record
    const updateInput: TrackHabitInput = {
      ...input,
      completed: false
    };

    const result = await trackHabit(updateInput);

    expect(result.habit_id).toEqual(habit.id);
    expect(result.date.getTime()).toEqual(testDate.getTime());
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should save tracking record to database', async () => {
    const habit = await createTestHabit();
    
    const testDate = new Date('2023-01-01');
    const dateString = testDate.toISOString().split('T')[0]; // Format for DB query
    
    const input: TrackHabitInput = {
      habit_id: habit.id,
      date: testDate,
      completed: true
    };

    const result = await trackHabit(input);

    // Query using proper drizzle syntax with formatted date string
    const trackingRecords = await db.select()
      .from(habitTrackingTable)
      .where(
        and(
          eq(habitTrackingTable.habit_id, habit.id),
          eq(habitTrackingTable.date, dateString)
        )
      )
      .execute();

    expect(trackingRecords).toHaveLength(1);
    expect(trackingRecords[0].habit_id).toEqual(habit.id);
    // Database returns date as string in the same format
    expect(trackingRecords[0].date).toEqual(dateString);
    expect(trackingRecords[0].completed).toEqual(true);
    expect(trackingRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple habits tracking on same date', async () => {
    // Create two habits
    const habit1 = await createTestHabit();
    const habit2 = await db.insert(habitsTable)
      .values({
        name: 'Second Habit',
        description: 'Another habit for testing'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const testDate = new Date('2023-01-01');
    const dateString = testDate.toISOString().split('T')[0]; // Format for DB query
    
    // Track both habits on the same date
    const input1: TrackHabitInput = {
      habit_id: habit1.id,
      date: testDate,
      completed: true
    };

    const input2: TrackHabitInput = {
      habit_id: habit2.id,
      date: testDate,
      completed: false
    };

    await trackHabit(input1);
    await trackHabit(input2);

    // Verify both records exist using formatted date string
    const trackingRecords = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.date, dateString))
      .execute();

    expect(trackingRecords).toHaveLength(2);
    expect(trackingRecords.some(record => 
      record.habit_id === habit1.id && record.completed === true
    )).toBe(true);
    expect(trackingRecords.some(record => 
      record.habit_id === habit2.id && record.completed === false
    )).toBe(true);
  });
});
