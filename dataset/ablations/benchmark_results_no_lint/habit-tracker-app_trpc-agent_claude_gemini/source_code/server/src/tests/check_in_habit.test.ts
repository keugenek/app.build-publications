import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { type CheckInHabitInput } from '../schema';
import { checkInHabit } from '../handlers/check_in_habit';
import { eq, and } from 'drizzle-orm';

describe('checkInHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabitId: number;

  beforeEach(async () => {
    // Create a test habit for each test
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing check-ins'
      })
      .returning()
      .execute();
    
    testHabitId = habitResult[0].id;
  });

  it('should create a habit check-in with current date when no date provided', async () => {
    const input: CheckInHabitInput = {
      habit_id: testHabitId
    };

    const result = await checkInHabit(input);

    // Basic field validation
    expect(result.habit_id).toEqual(testHabitId);
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Should use current date (within 1 second tolerance)
    const now = new Date();
    const timeDiff = Math.abs(result.completed_at.getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(1000);
  });

  it('should create a habit check-in with specified date', async () => {
    const specificDate = new Date('2024-01-15T10:30:00Z');
    const input: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    const result = await checkInHabit(input);

    expect(result.habit_id).toEqual(testHabitId);
    expect(result.completed_at).toEqual(specificDate);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save check-in to database', async () => {
    const specificDate = new Date('2024-01-15T10:30:00Z');
    const input: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    const result = await checkInHabit(input);

    // Verify it was saved to database
    const checkIns = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.id, result.id))
      .execute();

    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].habit_id).toEqual(testHabitId);
    expect(checkIns[0].completed_at).toEqual(specificDate);
    expect(checkIns[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when habit does not exist', async () => {
    const nonExistentHabitId = 99999;
    const input: CheckInHabitInput = {
      habit_id: nonExistentHabitId
    };

    await expect(checkInHabit(input)).rejects.toThrow(/habit.*does not exist/i);
  });

  it('should throw error when check-in already exists for same date', async () => {
    const specificDate = new Date('2024-01-15T10:30:00Z');
    const input: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: specificDate
    };

    // Create first check-in
    await checkInHabit(input);

    // Try to create duplicate check-in for same date
    await expect(checkInHabit(input)).rejects.toThrow(/check-in already exists/i);
  });

  it('should allow multiple check-ins for different dates', async () => {
    const date1 = new Date('2024-01-15T10:30:00Z');
    const date2 = new Date('2024-01-16T10:30:00Z');
    
    const input1: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: date1
    };
    
    const input2: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: date2
    };

    const result1 = await checkInHabit(input1);
    const result2 = await checkInHabit(input2);

    expect(result1.completed_at).toEqual(date1);
    expect(result2.completed_at).toEqual(date2);
    expect(result1.id).not.toEqual(result2.id);
    
    // Verify both exist in database
    const allCheckIns = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, testHabitId))
      .execute();
    
    expect(allCheckIns).toHaveLength(2);
  });

  it('should allow check-ins for different habits on same date', async () => {
    // Create second habit
    const habit2Result = await db.insert(habitsTable)
      .values({
        name: 'Second Test Habit',
        description: 'Another habit for testing'
      })
      .returning()
      .execute();
    
    const habit2Id = habit2Result[0].id;
    
    const sameDate = new Date('2024-01-15T10:30:00Z');
    
    const input1: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: sameDate
    };
    
    const input2: CheckInHabitInput = {
      habit_id: habit2Id,
      completed_at: sameDate
    };

    const result1 = await checkInHabit(input1);
    const result2 = await checkInHabit(input2);

    expect(result1.habit_id).toEqual(testHabitId);
    expect(result2.habit_id).toEqual(habit2Id);
    expect(result1.completed_at).toEqual(sameDate);
    expect(result2.completed_at).toEqual(sameDate);
  });

  it('should prevent duplicate check-ins on same calendar date', async () => {
    // Test with different times but same calendar date
    const utcMorning = new Date('2024-01-15T08:00:00Z');
    const utcEvening = new Date('2024-01-15T20:00:00Z');
    
    const input1: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: utcMorning
    };

    const result1 = await checkInHabit(input1);
    expect(result1.completed_at).toEqual(utcMorning);
    
    // Different time on same calendar date should be treated as duplicate
    const input2: CheckInHabitInput = {
      habit_id: testHabitId,
      completed_at: utcEvening
    };
    
    // This should throw an error since it's the same calendar date
    await expect(checkInHabit(input2)).rejects.toThrow(/check-in already exists/i);
  });
});
