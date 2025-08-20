import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { deleteHabit } from '../handlers/delete_habit';
import { eq } from 'drizzle-orm';

describe('deleteHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a habit successfully', async () => {
    // Create test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing deletion'
      })
      .returning()
      .execute();

    const habit = habitResult[0];

    // Verify habit exists before deletion
    let habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habits).toHaveLength(1);

    // Delete the habit
    await deleteHabit(habit.id);

    // Verify habit is deleted
    habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habits).toHaveLength(0);
  });

  it('should delete habit and cascade delete tracking data', async () => {
    // Create test habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Habit with Tracking',
        description: 'A habit with tracking data'
      })
      .returning()
      .execute();

    const habit = habitResult[0];

    // Create tracking data for the habit
    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: habit.id,
          date: '2024-01-01',
          completed: true
        },
        {
          habit_id: habit.id,
          date: '2024-01-02',
          completed: false
        }
      ])
      .execute();

    // Verify tracking data exists
    let trackingData = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, habit.id))
      .execute();

    expect(trackingData).toHaveLength(2);

    // Delete the habit
    await deleteHabit(habit.id);

    // Verify habit is deleted
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habits).toHaveLength(0);

    // Verify tracking data is also deleted due to cascade
    trackingData = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, habit.id))
      .execute();

    expect(trackingData).toHaveLength(0);
  });

  it('should handle deletion of non-existent habit gracefully', async () => {
    const nonExistentId = 99999;

    // Should not throw an error even if habit doesn't exist
    await expect(deleteHabit(nonExistentId)).resolves.toBeUndefined();

    // Verify no habits were affected
    const allHabits = await db.select()
      .from(habitsTable)
      .execute();

    expect(allHabits).toHaveLength(0);
  });

  it('should only delete the specified habit', async () => {
    // Create multiple test habits
    const habitResults = await db.insert(habitsTable)
      .values([
        {
          name: 'Habit 1',
          description: 'First habit'
        },
        {
          name: 'Habit 2',
          description: 'Second habit'
        },
        {
          name: 'Habit 3',
          description: 'Third habit'
        }
      ])
      .returning()
      .execute();

    const [habit1, habit2, habit3] = habitResults;

    // Add tracking data for each habit
    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: habit1.id,
          date: '2024-01-01',
          completed: true
        },
        {
          habit_id: habit2.id,
          date: '2024-01-01',
          completed: false
        },
        {
          habit_id: habit3.id,
          date: '2024-01-01',
          completed: true
        }
      ])
      .execute();

    // Delete only the second habit
    await deleteHabit(habit2.id);

    // Verify only habit2 is deleted
    const remainingHabits = await db.select()
      .from(habitsTable)
      .execute();

    expect(remainingHabits).toHaveLength(2);
    expect(remainingHabits.map(h => h.id)).toEqual(expect.arrayContaining([habit1.id, habit3.id]));
    expect(remainingHabits.map(h => h.id)).not.toContain(habit2.id);

    // Verify only habit2's tracking data is deleted
    const remainingTracking = await db.select()
      .from(habitTrackingTable)
      .execute();

    expect(remainingTracking).toHaveLength(2);
    expect(remainingTracking.map(t => t.habit_id)).toEqual(expect.arrayContaining([habit1.id, habit3.id]));
    expect(remainingTracking.map(t => t.habit_id)).not.toContain(habit2.id);
  });
});
