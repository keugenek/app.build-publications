import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, choresTable, assignmentsTable } from '../db/schema';
import { type WeekQuery } from '../schema';
import { getWeeklyAssignments } from '../handlers/get_weekly_assignments';

describe('getWeeklyAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create members
    const members = await db.insert(membersTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' }
      ])
      .returning()
      .execute();

    // Create chores
    const chores = await db.insert(choresTable)
      .values([
        { name: 'Dishes', description: 'Wash all dishes' },
        { name: 'Vacuum', description: 'Vacuum living room' }
      ])
      .returning()
      .execute();

    return { members, chores };
  };

  it('should return assignments for specified week', async () => {
    const { members, chores } = await createTestData();
    const weekStart = '2024-01-01'; // Monday

    // Create assignments for the specified week
    await db.insert(assignmentsTable)
      .values([
        {
          chore_id: chores[0].id,
          member_id: members[0].id,
          week_start: weekStart,
          is_completed: false
        },
        {
          chore_id: chores[1].id,
          member_id: members[1].id,
          week_start: weekStart,
          is_completed: true,
          completed_at: new Date()
        }
      ])
      .execute();

    const query: WeekQuery = { week_start: weekStart };
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(2);
    
    // Verify first assignment
    const assignment1 = result.find(a => a.chore.name === 'Dishes');
    expect(assignment1).toBeDefined();
    expect(assignment1!.chore.name).toEqual('Dishes');
    expect(assignment1!.chore.description).toEqual('Wash all dishes');
    expect(assignment1!.member.name).toEqual('Alice');
    expect(assignment1!.week_start).toEqual(new Date(weekStart));
    expect(assignment1!.is_completed).toEqual(false);
    expect(assignment1!.completed_at).toBeNull();

    // Verify second assignment
    const assignment2 = result.find(a => a.chore.name === 'Vacuum');
    expect(assignment2).toBeDefined();
    expect(assignment2!.chore.name).toEqual('Vacuum');
    expect(assignment2!.member.name).toEqual('Bob');
    expect(assignment2!.is_completed).toEqual(true);
    expect(assignment2!.completed_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no assignments exist for week', async () => {
    await createTestData();
    const weekStart = '2024-01-08'; // Different week with no assignments

    const query: WeekQuery = { week_start: weekStart };
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(0);
  });

  it('should return assignments for current week when no week_start provided', async () => {
    const { members, chores } = await createTestData();
    
    // Calculate current Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - daysToMonday);
    currentMonday.setHours(0, 0, 0, 0);
    const currentMondayString = currentMonday.toISOString().split('T')[0];

    // Create assignment for current week
    await db.insert(assignmentsTable)
      .values({
        chore_id: chores[0].id,
        member_id: members[0].id,
        week_start: currentMondayString,
        is_completed: false
      })
      .execute();

    const query: WeekQuery = {}; // No week_start provided
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(1);
    expect(result[0].chore.name).toEqual('Dishes');
    expect(result[0].member.name).toEqual('Alice');
    expect(result[0].week_start).toEqual(currentMonday);
  });

  it('should handle multiple assignments for same member in same week', async () => {
    const { members, chores } = await createTestData();
    const weekStart = '2024-01-01';

    // Create multiple assignments for same member
    await db.insert(assignmentsTable)
      .values([
        {
          chore_id: chores[0].id,
          member_id: members[0].id,
          week_start: weekStart,
          is_completed: false
        },
        {
          chore_id: chores[1].id,
          member_id: members[0].id,
          week_start: weekStart,
          is_completed: true,
          completed_at: new Date()
        }
      ])
      .execute();

    const query: WeekQuery = { week_start: weekStart };
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(2);
    expect(result.every(a => a.member.name === 'Alice')).toBe(true);
    expect(result.some(a => a.is_completed)).toBe(true);
    expect(result.some(a => !a.is_completed)).toBe(true);
  });

  it('should not return assignments from different weeks', async () => {
    const { members, chores } = await createTestData();
    const weekStart = '2024-01-01';
    const differentWeek = '2024-01-08';

    // Create assignments for different weeks
    await db.insert(assignmentsTable)
      .values([
        {
          chore_id: chores[0].id,
          member_id: members[0].id,
          week_start: weekStart,
          is_completed: false
        },
        {
          chore_id: chores[1].id,
          member_id: members[1].id,
          week_start: differentWeek,
          is_completed: false
        }
      ])
      .execute();

    const query: WeekQuery = { week_start: weekStart };
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(1);
    expect(result[0].chore.name).toEqual('Dishes');
    expect(result[0].week_start).toEqual(new Date(weekStart));
  });

  it('should include all required fields in response', async () => {
    const { members, chores } = await createTestData();
    const weekStart = '2024-01-01';

    await db.insert(assignmentsTable)
      .values({
        chore_id: chores[0].id,
        member_id: members[0].id,
        week_start: weekStart,
        is_completed: true,
        completed_at: new Date()
      })
      .execute();

    const query: WeekQuery = { week_start: weekStart };
    const result = await getWeeklyAssignments(query);

    expect(result).toHaveLength(1);
    const assignment = result[0];

    // Assignment fields
    expect(assignment.id).toBeDefined();
    expect(typeof assignment.id).toBe('number');
    expect(assignment.chore_id).toBeDefined();
    expect(assignment.member_id).toBeDefined();
    expect(assignment.week_start).toBeInstanceOf(Date);
    expect(typeof assignment.is_completed).toBe('boolean');
    expect(assignment.completed_at).toBeInstanceOf(Date);
    expect(assignment.created_at).toBeInstanceOf(Date);

    // Chore fields
    expect(assignment.chore.id).toBeDefined();
    expect(assignment.chore.name).toBeDefined();
    expect(assignment.chore.description).toBeDefined();
    expect(assignment.chore.created_at).toBeInstanceOf(Date);

    // Member fields
    expect(assignment.member.id).toBeDefined();
    expect(assignment.member.name).toBeDefined();
    expect(assignment.member.created_at).toBeInstanceOf(Date);
  });
});
