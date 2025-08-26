import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { deleteHabit } from '../handlers/delete_habit';
import { eq } from 'drizzle-orm';

describe('deleteHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a habit successfully', async () => {
    // Create a test habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing deletion'
      })
      .returning()
      .execute();

    // Delete the habit
    const result = await deleteHabit(habit.id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify habit is deleted from database
    const habitsAfterDelete = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habitsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete associated check-ins', async () => {
    // Create a test habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit with Check-ins',
        description: 'A habit with check-ins to test cascade delete'
      })
      .returning()
      .execute();

    // Create some check-ins for the habit
    await db.insert(habitCheckInsTable)
      .values([
        {
          habit_id: habit.id,
          completed_at: new Date('2024-01-01')
        },
        {
          habit_id: habit.id,
          completed_at: new Date('2024-01-02')
        }
      ])
      .execute();

    // Verify check-ins exist before deletion
    const checkInsBeforeDelete = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, habit.id))
      .execute();

    expect(checkInsBeforeDelete).toHaveLength(2);

    // Delete the habit
    const result = await deleteHabit(habit.id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify habit is deleted
    const habitsAfterDelete = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(habitsAfterDelete).toHaveLength(0);

    // Verify associated check-ins are cascade deleted
    const checkInsAfterDelete = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, habit.id))
      .execute();

    expect(checkInsAfterDelete).toHaveLength(0);
  });

  it('should throw error when habit does not exist', async () => {
    const nonExistentHabitId = 999999;

    // Attempt to delete non-existent habit
    await expect(deleteHabit(nonExistentHabitId))
      .rejects
      .toThrow(/habit with id 999999 not found/i);
  });

  it('should not affect other habits when deleting one habit', async () => {
    // Create multiple test habits
    const [habit1] = await db.insert(habitsTable)
      .values({
        name: 'Habit 1',
        description: 'First habit'
      })
      .returning()
      .execute();

    const [habit2] = await db.insert(habitsTable)
      .values({
        name: 'Habit 2',
        description: 'Second habit'
      })
      .returning()
      .execute();

    // Create check-ins for both habits
    await db.insert(habitCheckInsTable)
      .values([
        {
          habit_id: habit1.id,
          completed_at: new Date('2024-01-01')
        },
        {
          habit_id: habit2.id,
          completed_at: new Date('2024-01-01')
        }
      ])
      .execute();

    // Delete only the first habit
    const result = await deleteHabit(habit1.id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify first habit is deleted
    const habit1AfterDelete = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit1.id))
      .execute();

    expect(habit1AfterDelete).toHaveLength(0);

    // Verify second habit still exists
    const habit2AfterDelete = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit2.id))
      .execute();

    expect(habit2AfterDelete).toHaveLength(1);
    expect(habit2AfterDelete[0].name).toEqual('Habit 2');

    // Verify first habit's check-ins are deleted
    const habit1CheckInsAfterDelete = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, habit1.id))
      .execute();

    expect(habit1CheckInsAfterDelete).toHaveLength(0);

    // Verify second habit's check-ins still exist
    const habit2CheckInsAfterDelete = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, habit2.id))
      .execute();

    expect(habit2CheckInsAfterDelete).toHaveLength(1);
  });
});
