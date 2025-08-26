import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type GetHabitProgressInput } from '../schema';
import { getHabitProgress } from '../handlers/get_habit_progress';
import { eq } from 'drizzle-orm';

describe('getHabitProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHabitId: number;
  let otherHabitId: number;

  beforeEach(async () => {
    // Create test habits
    const habits = await db.insert(habitsTable)
      .values([
        {
          name: 'Test Habit',
          description: 'A habit for testing'
        },
        {
          name: 'Other Habit',
          description: 'Another habit for testing'
        }
      ])
      .returning()
      .execute();

    testHabitId = habits[0].id;
    otherHabitId = habits[1].id;

    // Create test tracking data
    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: testHabitId,
          date: '2024-01-01',
          completed: true
        },
        {
          habit_id: testHabitId,
          date: '2024-01-02',
          completed: false
        },
        {
          habit_id: testHabitId,
          date: '2024-01-03',
          completed: true
        },
        {
          habit_id: testHabitId,
          date: '2024-01-05',
          completed: true
        },
        {
          habit_id: testHabitId,
          date: '2024-01-10',
          completed: false
        },
        // Data for other habit (should not be returned)
        {
          habit_id: otherHabitId,
          date: '2024-01-01',
          completed: true
        }
      ])
      .execute();
  });

  it('should get all progress for a habit', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(5);
    
    // Verify results are ordered by date
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[2].date).toEqual(new Date('2024-01-03'));
    expect(result[3].date).toEqual(new Date('2024-01-05'));
    expect(result[4].date).toEqual(new Date('2024-01-10'));

    // Verify completion status
    expect(result[0].completed).toBe(true);
    expect(result[1].completed).toBe(false);
    expect(result[2].completed).toBe(true);
    expect(result[3].completed).toBe(true);
    expect(result[4].completed).toBe(false);

    // Verify all results belong to the correct habit
    result.forEach(tracking => {
      expect(tracking.habit_id).toBe(testHabitId);
      expect(tracking.id).toBeDefined();
      expect(tracking.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter progress by start date', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId,
      start_date: '2024-01-03'
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date('2024-01-03'));
    expect(result[1].date).toEqual(new Date('2024-01-05'));
    expect(result[2].date).toEqual(new Date('2024-01-10'));
  });

  it('should filter progress by end date', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId,
      end_date: '2024-01-03'
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[2].date).toEqual(new Date('2024-01-03'));
  });

  it('should filter progress by date range', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId,
      start_date: '2024-01-02',
      end_date: '2024-01-05'
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date('2024-01-02'));
    expect(result[1].date).toEqual(new Date('2024-01-03'));
    expect(result[2].date).toEqual(new Date('2024-01-05'));
  });

  it('should return empty array for habit with no tracking data', async () => {
    // Create a new habit with no tracking data
    const newHabit = await db.insert(habitsTable)
      .values({
        name: 'Empty Habit',
        description: 'Habit with no tracking'
      })
      .returning()
      .execute();

    const input: GetHabitProgressInput = {
      habit_id: newHabit[0].id
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for date range with no data', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId,
      start_date: '2024-02-01',
      end_date: '2024-02-28'
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error for non-existent habit', async () => {
    const input: GetHabitProgressInput = {
      habit_id: 99999
    };

    expect(getHabitProgress(input)).rejects.toThrow(/habit with id 99999 not found/i);
  });

  it('should handle single day date range', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId,
      start_date: '2024-01-03',
      end_date: '2024-01-03'
    };

    const result = await getHabitProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-03'));
    expect(result[0].completed).toBe(true);
  });

  it('should save tracking data correctly in database', async () => {
    const input: GetHabitProgressInput = {
      habit_id: testHabitId
    };

    const result = await getHabitProgress(input);
    
    // Verify the data exists in the database
    const dbRecords = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, testHabitId))
      .execute();

    expect(dbRecords).toHaveLength(5);
    expect(result).toHaveLength(5);

    // Compare handler results with direct database query
    result.forEach((tracking, index) => {
      const dbRecord = dbRecords.find(record => record.id === tracking.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.habit_id).toBe(testHabitId);
      expect(new Date(dbRecord!.date)).toEqual(tracking.date);
      expect(dbRecord!.completed).toBe(tracking.completed);
      expect(dbRecord!.created_at).toBeInstanceOf(Date);
    });
  });
});
