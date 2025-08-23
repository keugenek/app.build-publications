import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitChecksTable } from '../db/schema';
import { getHabitChecks } from '../handlers/get_habit_checks';
// import { eq } from 'drizzle-orm';

/**
 * Helper to create a habit directly via DB.
 */
const createHabit = async (name: string, description: string | null = null) => {
  const [habit] = await db
    .insert(habitsTable)
    .values({ name, description })
    .returning()
    .execute();
  return habit;
};

/**
 * Helper to create a habit check directly via DB.
 */
const createHabitCheck = async (habitId: number, checkDate: string) => {
  const [check] = await db
    .insert(habitChecksTable)
    .values({ habit_id: habitId, check_date: checkDate as any })
    .returning()
    .execute();
  return check;
};

describe('getHabitChecks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns an empty array when no checks exist', async () => {
    const checks = await getHabitChecks();
    expect(checks).toEqual([]);
  });

  it('fetches habit checks with proper date conversion', async () => {
    const habit = await createHabit('Read a book');
    const inserted = await createHabitCheck(habit.id, '2023-01-15');

    const checks = await getHabitChecks();
    expect(checks).toHaveLength(1);
    const check = checks[0];
    expect(check.habit_id).toBe(habit.id);
    expect(check.id).toBe(inserted.id);
    // check_date should be a Date instance representing the inserted date
    expect(check.check_date).toBeInstanceOf(Date);
    expect(check.check_date.toISOString().split('T')[0]).toBe('2023-01-15');
    // completed defaults to true
    expect(check.completed).toBe(true);
  });

  it('fetches multiple habit checks', async () => {
    const habit = await createHabit('Exercise');
    await createHabitCheck(habit.id, '2023-02-01');
    await createHabitCheck(habit.id, '2023-02-02');

    const checks = await getHabitChecks();
    expect(checks).toHaveLength(2);
    const dates = checks.map((c) => c.check_date.toISOString().split('T')[0]);
    expect(dates).toContain('2023-02-01');
    expect(dates).toContain('2023-02-02');
  });
});
