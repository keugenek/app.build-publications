import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, usersTable, weeklyAssignmentsTable } from '../db/schema';
import { getUserAssignments } from '../handlers/get_user_assignments';
import { eq } from 'drizzle-orm';

describe('getUserAssignments', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();
    
    const userId = users[0].id;
    
    // Create test chore
    const chores = await db.insert(choresTable)
      .values({
        name: 'Clean dishes',
        description: 'Wash and put away all dishes'
      })
      .returning()
      .execute();
    
    const choreId = chores[0].id;
    
    // Create assignment for current week
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - daysSinceMonday);
    const weekStartString = weekStart.toISOString().split('T')[0];
    
    await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: weekStartString,
        chore_id: choreId,
        user_id: userId,
        is_completed: false
      })
      .execute();
  });

  afterEach(resetDB);

  it('should fetch current week assignments for a user', async () => {
    // Get the user ID
    const users = await db.select().from(usersTable).execute();
    const userId = users[0].id;
    
    const result = await getUserAssignments(userId);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      assignment_id: expect.any(Number),
      week_start_date: expect.any(Date),
      chore_name: 'Clean dishes',
      chore_description: 'Wash and put away all dishes',
      user_name: 'John Doe',
      is_completed: false,
      completed_at: null
    });
    
    // Verify it's for the current week
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const expectedWeekStart = new Date(currentDate);
    expectedWeekStart.setDate(currentDate.getDate() - daysSinceMonday);
    expectedWeekStart.setHours(0, 0, 0, 0);
    
    // Check that the week_start_date is the Monday of the current week
    const resultDate = result[0].week_start_date;
    expect(resultDate.getDay()).toBe(1); // Monday
    expect(resultDate.getDate()).toBe(expectedWeekStart.getDate());
    expect(resultDate.getMonth()).toBe(expectedWeekStart.getMonth());
    expect(resultDate.getFullYear()).toBe(expectedWeekStart.getFullYear());
  });

  it('should return empty array when user has no assignments', async () => {
    const result = await getUserAssignments(999); // Non-existent user ID
    expect(result).toHaveLength(0);
  });

  it('should only return assignments for the current week', async () => {
    // Get the user ID
    const users = await db.select().from(usersTable).execute();
    const userId = users[0].id;
    
    // Create assignment for next week
    const currentDate = new Date();
    const nextWeekStart = new Date(currentDate);
    nextWeekStart.setDate(currentDate.getDate() + 7);
    const nextWeekStartString = nextWeekStart.toISOString().split('T')[0];
    
    const chores = await db.select().from(choresTable).execute();
    const choreId = chores[0].id;
    
    await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: nextWeekStartString,
        chore_id: choreId,
        user_id: userId,
        is_completed: false
      })
      .execute();
    
    // Should still only return the current week assignment
    const result = await getUserAssignments(userId);
    expect(result).toHaveLength(1);
  });
});
