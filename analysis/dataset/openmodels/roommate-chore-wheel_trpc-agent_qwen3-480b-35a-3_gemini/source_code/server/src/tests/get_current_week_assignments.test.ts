import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, usersTable, weeklyAssignmentsTable } from '../db/schema';
import { getCurrentWeekAssignments } from '../handlers/get_current_week_assignments';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { eq } from 'drizzle-orm';

describe('getCurrentWeekAssignments', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test chore
    const [chore] = await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        description: 'A test chore description'
      })
      .returning()
      .execute();
    
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    // Create assignments for current week
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekStartString = weekStart.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: weekStartString,
        chore_id: chore.id,
        user_id: user.id,
        is_completed: false
      })
      .execute();
      
    // Create assignment for next week (should not appear in results)
    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const nextWeekStartString = nextWeekStart.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: nextWeekStartString,
        chore_id: chore.id,
        user_id: user.id,
        is_completed: false
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should return assignments for the current week only', async () => {
    const results = await getCurrentWeekAssignments();
    
    expect(results).toHaveLength(1);
    expect(results[0].chore_name).toEqual('Test Chore');
    expect(results[0].user_name).toEqual('Test User');
    expect(results[0].is_completed).toBe(false);
    expect(results[0].chore_description).toEqual('A test chore description');
    
    // Verify the assignment is for the current week
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    expect(results[0].week_start_date).toBeInstanceOf(Date);
    // Compare dates properly by converting toISOString and comparing just the date part
    expect(results[0].week_start_date.toISOString().split('T')[0]).toBe(weekStart.toISOString().split('T')[0]);
  });

  it('should return completed assignments with completion timestamp', async () => {
    // Mark the assignment as completed
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartString = weekStart.toISOString().split('T')[0];
    
    const assignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.week_start_date, weekStartString))
      .execute();
      
    const [updatedAssignment] = await db.update(weeklyAssignmentsTable)
      .set({
        is_completed: true,
        completed_at: new Date()
      })
      .where(eq(weeklyAssignmentsTable.id, assignments[0].id))
      .returning()
      .execute();
    
    const results = await getCurrentWeekAssignments();
    
    expect(results).toHaveLength(1);
    expect(results[0].is_completed).toBe(true);
    expect(results[0].completed_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no assignments exist for current week', async () => {
    // Clear all assignments
    await db.delete(weeklyAssignmentsTable).execute();
    
    const results = await getCurrentWeekAssignments();
    
    expect(results).toHaveLength(0);
  });

  it('should correctly join chore and user information', async () => {
    const results = await getCurrentWeekAssignments();
    
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      chore_name: 'Test Chore',
      chore_description: 'A test chore description',
      user_name: 'Test User',
      is_completed: false
    });
    
    // Verify types
    expect(typeof results[0].chore_name).toBe('string');
    expect(typeof results[0].user_name).toBe('string');
    expect(typeof results[0].is_completed).toBe('boolean');
    expect(results[0].assignment_id).toBeTypeOf('number');
  });
});
