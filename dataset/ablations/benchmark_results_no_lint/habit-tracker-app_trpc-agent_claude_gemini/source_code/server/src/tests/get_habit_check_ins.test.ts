import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { getHabitCheckIns } from '../handlers/get_habit_check_ins';

describe('getHabitCheckIns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all check-ins for a specific habit', async () => {
    // Create a test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();

    const habitId = habitResult[0].id;

    // Create multiple check-ins for the habit
    const checkInDates = [
      new Date('2024-01-03'),
      new Date('2024-01-01'),
      new Date('2024-01-02')
    ];

    for (const date of checkInDates) {
      await db.insert(habitCheckInsTable)
        .values({
          habit_id: habitId,
          completed_at: date
        })
        .execute();
    }

    // Fetch check-ins
    const checkIns = await getHabitCheckIns(habitId);

    // Should return all check-ins
    expect(checkIns).toHaveLength(3);

    // Should be ordered by completed_at date (most recent first)
    expect(checkIns[0].completed_at).toEqual(new Date('2024-01-03'));
    expect(checkIns[1].completed_at).toEqual(new Date('2024-01-02'));
    expect(checkIns[2].completed_at).toEqual(new Date('2024-01-01'));

    // All check-ins should belong to the correct habit
    checkIns.forEach(checkIn => {
      expect(checkIn.habit_id).toEqual(habitId);
      expect(checkIn.id).toBeDefined();
      expect(checkIn.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when habit has no check-ins', async () => {
    // Create a test habit without check-ins
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Habit Without Check-ins',
        description: 'A habit with no check-ins'
      })
      .returning()
      .execute();

    const habitId = habitResult[0].id;

    // Fetch check-ins
    const checkIns = await getHabitCheckIns(habitId);

    // Should return empty array
    expect(checkIns).toHaveLength(0);
    expect(checkIns).toEqual([]);
  });

  it('should throw error when habit does not exist', async () => {
    const nonExistentHabitId = 99999;

    // Should throw error for non-existent habit
    await expect(getHabitCheckIns(nonExistentHabitId))
      .rejects
      .toThrow(/Habit with id 99999 not found/i);
  });

  it('should only return check-ins for the specified habit', async () => {
    // Create two test habits
    const habit1Result = await db.insert(habitsTable)
      .values({
        name: 'Habit 1',
        description: 'First habit'
      })
      .returning()
      .execute();

    const habit2Result = await db.insert(habitsTable)
      .values({
        name: 'Habit 2',
        description: 'Second habit'
      })
      .returning()
      .execute();

    const habit1Id = habit1Result[0].id;
    const habit2Id = habit2Result[0].id;

    // Create check-ins for both habits
    await db.insert(habitCheckInsTable)
      .values([
        {
          habit_id: habit1Id,
          completed_at: new Date('2024-01-01')
        },
        {
          habit_id: habit1Id,
          completed_at: new Date('2024-01-02')
        },
        {
          habit_id: habit2Id,
          completed_at: new Date('2024-01-01')
        }
      ])
      .execute();

    // Fetch check-ins for habit 1
    const habit1CheckIns = await getHabitCheckIns(habit1Id);

    // Should only return check-ins for habit 1
    expect(habit1CheckIns).toHaveLength(2);
    habit1CheckIns.forEach(checkIn => {
      expect(checkIn.habit_id).toEqual(habit1Id);
    });

    // Fetch check-ins for habit 2
    const habit2CheckIns = await getHabitCheckIns(habit2Id);

    // Should only return check-ins for habit 2
    expect(habit2CheckIns).toHaveLength(1);
    expect(habit2CheckIns[0].habit_id).toEqual(habit2Id);
  });

  it('should handle check-ins with same completed_at date', async () => {
    // Create a test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning()
      .execute();

    const habitId = habitResult[0].id;

    // Create multiple check-ins with the same completed_at date
    const sameDate = new Date('2024-01-01');
    
    await db.insert(habitCheckInsTable)
      .values([
        {
          habit_id: habitId,
          completed_at: sameDate
        },
        {
          habit_id: habitId,
          completed_at: sameDate
        }
      ])
      .execute();

    // Fetch check-ins
    const checkIns = await getHabitCheckIns(habitId);

    // Should return both check-ins
    expect(checkIns).toHaveLength(2);
    checkIns.forEach(checkIn => {
      expect(checkIn.completed_at).toEqual(sameDate);
      expect(checkIn.habit_id).toEqual(habitId);
    });
  });
});
