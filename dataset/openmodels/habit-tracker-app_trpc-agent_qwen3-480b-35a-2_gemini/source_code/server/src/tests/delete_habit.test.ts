import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { deleteHabit } from '../handlers/delete_habit';
import { eq } from 'drizzle-orm';

describe('deleteHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a habit and its tracking records', async () => {
    // First create a habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily exercise routine'
      })
      .returning()
      .execute();
    
    const habitId = habitResult[0].id;
    
    // Create some tracking records for this habit
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habitId,
        date: '2023-01-01',
        completed: true
      })
      .execute();
    
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habitId,
        date: '2023-01-02',
        completed: false
      })
      .execute();
    
    // Verify the habit and tracking records exist
    const habitsBefore = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();
    
    const trackingBefore = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, habitId))
      .execute();
    
    expect(habitsBefore).toHaveLength(1);
    expect(trackingBefore).toHaveLength(2);
    
    // Delete the habit
    await deleteHabit(habitId);
    
    // Verify the habit and tracking records are deleted
    const habitsAfter = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();
    
    const trackingAfter = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, habitId))
      .execute();
    
    expect(habitsAfter).toHaveLength(0);
    expect(trackingAfter).toHaveLength(0);
  });

  it('should not throw an error when trying to delete a non-existent habit', async () => {
    // This should not throw an error even if the habit doesn't exist
    await expect(deleteHabit(99999)).resolves.toBeUndefined();
  });

  it('should only delete tracking records for the specified habit', async () => {
    // Create two habits
    const habitResults = await db.insert(habitsTable)
      .values([
        {
          name: 'Exercise',
          description: 'Daily exercise routine'
        },
        {
          name: 'Reading',
          description: 'Read for 30 minutes'
        }
      ])
      .returning()
      .execute();
    
    const habit1Id = habitResults[0].id;
    const habit2Id = habitResults[1].id;
    
    // Create tracking records for both habits
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit1Id,
        date: '2023-01-01',
        completed: true
      })
      .execute();
    
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit2Id,
        date: '2023-01-02',
        completed: false
      })
      .execute();
    
    // Delete only the first habit
    await deleteHabit(habit1Id);
    
    // Verify first habit is deleted but second habit and its tracking remain
    const habits = await db.select().from(habitsTable).execute();
    const tracking = await db.select().from(habitTrackingTable).execute();
    
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(habit2Id);
    expect(tracking).toHaveLength(1);
    expect(tracking[0].habit_id).toBe(habit2Id);
  });
});
