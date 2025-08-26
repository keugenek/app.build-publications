import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { type CreateHabitInput, type UpdateHabitInput } from '../schema';
import { createHabit, getHabits, updateHabit } from '../handlers';

// Test data
const testHabitInput: CreateHabitInput = {
  name: 'Morning Run'
};

describe('Habit Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createHabit', () => {
    it('should create a habit', async () => {
      const result = await createHabit(testHabitInput);

      expect(result.name).toEqual('Morning Run');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save habit to database', async () => {
      const result = await createHabit(testHabitInput);

      const habits = await db.select()
        .from(habitsTable)
        .where(eq(habitsTable.id, result.id))
        .execute();

      expect(habits).toHaveLength(1);
      expect(habits[0].name).toEqual('Morning Run');
      expect(habits[0].created_at).toBeInstanceOf(Date);
    });
  });

  describe('getHabits', () => {
    it('should return all habits with streak information', async () => {
      // Create a few test habits
      const habit1 = await createHabit({ name: 'Morning Run' });
      const habit2 = await createHabit({ name: 'Read Books' });

      // Add some habit entries for streak calculation
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Mark habit1 as completed today
      await db.insert(habitEntriesTable).values({
        habit_id: habit1.id,
        date: today,
        completed: true
      }).execute();

      // Mark habit1 as completed yesterday
      await db.insert(habitEntriesTable).values({
        habit_id: habit1.id,
        date: yesterday,
        completed: true
      }).execute();

      // Mark habit2 as not completed today
      await db.insert(habitEntriesTable).values({
        habit_id: habit2.id,
        date: today,
        completed: false
      }).execute();

      const results = await getHabits();

      expect(results).toHaveLength(2);
      
      const habitWithStreak1 = results.find(h => h.id === habit1.id);
      const habitWithStreak2 = results.find(h => h.id === habit2.id);

      expect(habitWithStreak1).toBeDefined();
      expect(habitWithStreak1?.is_completed_today).toBe(true);
      expect(habitWithStreak1?.current_streak).toBe(2);
      expect(habitWithStreak1?.longest_streak).toBe(2);

      expect(habitWithStreak2).toBeDefined();
      expect(habitWithStreak2?.is_completed_today).toBe(false);
      expect(habitWithStreak2?.current_streak).toBe(0);
      expect(habitWithStreak2?.longest_streak).toBe(0);
    });
  });

  describe('updateHabit', () => {
    it('should mark habit as completed for today', async () => {
      const habit = await createHabit(testHabitInput);
      
      const updateInput: UpdateHabitInput = {
        id: habit.id,
        is_completed_today: true
      };

      const updatedHabit = await updateHabit(updateInput);
      
      expect(updatedHabit.is_completed_today).toBe(true);
      expect(updatedHabit.current_streak).toBe(1);
      expect(updatedHabit.longest_streak).toBe(1);

      // Verify entry was saved to database
      const entries = await db.select()
        .from(habitEntriesTable)
        .where(eq(habitEntriesTable.habit_id, habit.id))
        .execute();

      expect(entries).toHaveLength(1);
      expect(entries[0].completed).toBe(true);
      expect(entries[0].date).toBeInstanceOf(Date);
    });

    it('should mark habit as not completed for today', async () => {
      const habit = await createHabit(testHabitInput);
      
      // First mark as completed
      await updateHabit({
        id: habit.id,
        is_completed_today: true
      });
      
      // Then mark as not completed
      const updateInput: UpdateHabitInput = {
        id: habit.id,
        is_completed_today: false
      };

      const updatedHabit = await updateHabit(updateInput);
      
      expect(updatedHabit.is_completed_today).toBe(false);
      expect(updatedHabit.current_streak).toBe(0);

      // Verify entry was updated in database
      const entries = await db.select()
        .from(habitEntriesTable)
        .where(eq(habitEntriesTable.habit_id, habit.id))
        .execute();

      expect(entries).toHaveLength(1);
      expect(entries[0].completed).toBe(false);
    });
  });
});
