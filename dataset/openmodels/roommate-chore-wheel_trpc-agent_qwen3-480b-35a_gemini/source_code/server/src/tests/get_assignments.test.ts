import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, choresTable, weeklyAssignmentsTable } from '../db/schema';
import { getAssignments } from '../handlers/get_assignments';
import { eq } from 'drizzle-orm';

describe('getAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no assignments exist', async () => {
    const result = await getAssignments();
    expect(result).toEqual([]);
  });

  it('should return current week assignments with member and chore details', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({ name: 'John Doe' })
      .returning()
      .execute();
    
    const choreResult = await db.insert(choresTable)
      .values({ name: 'Clean kitchen', description: 'Wash dishes and wipe counters' })
      .returning()
      .execute();
    
    const member = memberResult[0];
    const chore = choreResult[0];
    
    // Calculate current week's Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysSinceMonday);
    weekStartDate.setHours(0, 0, 0, 0);

    // Format date as YYYY-MM-DD string for database
    const weekStartDateString = weekStartDate.toISOString().split('T')[0];

    // Create assignment for current week
    await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: member.id,
        chore_id: chore.id,
        week_start_date: weekStartDateString,
        is_completed: false
      })
      .execute();

    // Test the handler
    const result = await getAssignments();

    expect(result).toHaveLength(1);
    const assignment = result[0];
    
    // Validate assignment structure
    expect(assignment.id).toBeDefined();
    expect(assignment.week_start_date.toISOString().split('T')[0]).toEqual(weekStartDateString);
    expect(assignment.is_completed).toBe(false);
    expect(assignment.completed_at).toBeNull();
    
    // Validate member details
    expect(assignment.member.id).toEqual(member.id);
    expect(assignment.member.name).toEqual('John Doe');
    expect(assignment.member.created_at).toBeInstanceOf(Date);
    
    // Validate chore details
    expect(assignment.chore.id).toEqual(chore.id);
    expect(assignment.chore.name).toEqual('Clean kitchen');
    expect(assignment.chore.description).toEqual('Wash dishes and wipe counters');
    expect(assignment.chore.created_at).toBeInstanceOf(Date);
  });

  it('should not return assignments from other weeks', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({ name: 'Jane Smith' })
      .returning()
      .execute();
    
    const choreResult = await db.insert(choresTable)
      .values({ name: 'Take out trash', description: 'Empty all trash bins' })
      .returning()
      .execute();
    
    const member = memberResult[0];
    const chore = choreResult[0];
    
    // Calculate current week's Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysSinceMonday);
    weekStartDate.setHours(0, 0, 0, 0);

    // Format dates as YYYY-MM-DD strings for database
    const weekStartDateString = weekStartDate.toISOString().split('T')[0];
    
    const previousWeekDate = new Date(weekStartDate);
    previousWeekDate.setDate(weekStartDate.getDate() - 7);
    const previousWeekDateString = previousWeekDate.toISOString().split('T')[0];

    // Create assignment for current week
    await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: member.id,
        chore_id: chore.id,
        week_start_date: weekStartDateString,
        is_completed: true,
        completed_at: new Date()
      })
      .execute();

    // Create assignment for previous week (should not be returned)
    await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: member.id,
        chore_id: chore.id,
        week_start_date: previousWeekDateString,
        is_completed: false
      })
      .execute();

    // Test the handler
    const result = await getAssignments();

    // Should only return the current week's assignment
    expect(result).toHaveLength(1);
    expect(result[0].week_start_date.toISOString().split('T')[0]).toEqual(weekStartDateString);
    expect(result[0].is_completed).toBe(true);
  });
});
