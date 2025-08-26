import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { getCurrentWeekAssignments } from '../handlers/get_current_week_assignments';

describe('getCurrentWeekAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assignments exist for current week', async () => {
    const result = await getCurrentWeekAssignments();
    expect(result).toEqual([]);
  });

  it('should return current week assignments with chore details', async () => {
    // Create test chores
    const chores = await db.insert(choresTable)
      .values([
        { name: 'Take out trash', description: 'Weekly trash collection' },
        { name: 'Clean bathroom', description: 'Deep clean bathroom' }
      ])
      .returning()
      .execute();

    // Calculate current week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);
    const weekStartString = currentWeekStart.toISOString().split('T')[0];

    // Create assignments for current week
    const assignments = await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: chores[0].id,
          week_start: weekStartString,
          assigned_person: 'Alice',
          is_completed: false,
          completed_at: null
        },
        {
          chore_id: chores[1].id,
          week_start: weekStartString,
          assigned_person: 'Bob',
          is_completed: true,
          completed_at: new Date()
        }
      ])
      .returning()
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(2);
    
    // Verify first assignment
    const trashAssignment = result.find(a => a.chore_name === 'Take out trash');
    expect(trashAssignment).toBeDefined();
    expect(trashAssignment!.assignment_id).toEqual(assignments[0].id);
    expect(trashAssignment!.chore_id).toEqual(chores[0].id);
    expect(trashAssignment!.chore_name).toEqual('Take out trash');
    expect(trashAssignment!.chore_description).toEqual('Weekly trash collection');
    expect(trashAssignment!.assigned_person).toEqual('Alice');
    expect(trashAssignment!.is_completed).toEqual(false);
    expect(trashAssignment!.completed_at).toBeNull();
    expect(trashAssignment!.week_start).toBeInstanceOf(Date);

    // Verify second assignment
    const bathroomAssignment = result.find(a => a.chore_name === 'Clean bathroom');
    expect(bathroomAssignment).toBeDefined();
    expect(bathroomAssignment!.assignment_id).toEqual(assignments[1].id);
    expect(bathroomAssignment!.chore_id).toEqual(chores[1].id);
    expect(bathroomAssignment!.chore_name).toEqual('Clean bathroom');
    expect(bathroomAssignment!.chore_description).toEqual('Deep clean bathroom');
    expect(bathroomAssignment!.assigned_person).toEqual('Bob');
    expect(bathroomAssignment!.is_completed).toEqual(true);
    expect(bathroomAssignment!.completed_at).toBeInstanceOf(Date);
    expect(bathroomAssignment!.week_start).toBeInstanceOf(Date);
  });

  it('should not return assignments from different weeks', async () => {
    // Create test chore
    const chore = await db.insert(choresTable)
      .values({ name: 'Test chore', description: 'Test description' })
      .returning()
      .execute();

    // Calculate dates for different weeks
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastWeekString = lastWeek.toISOString().split('T')[0];

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekString = nextWeek.toISOString().split('T')[0];

    // Create assignments for last week and next week
    await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: chore[0].id,
          week_start: lastWeekString,
          assigned_person: 'Alice',
          is_completed: false,
          completed_at: null
        },
        {
          chore_id: chore[0].id,
          week_start: nextWeekString,
          assigned_person: 'Bob',
          is_completed: false,
          completed_at: null
        }
      ])
      .execute();

    const result = await getCurrentWeekAssignments();

    // Should return empty array since no assignments for current week
    expect(result).toEqual([]);
  });

  it('should handle assignments with null descriptions and assigned persons', async () => {
    // Create chore with null description
    const chore = await db.insert(choresTable)
      .values({ name: 'Simple chore', description: null })
      .returning()
      .execute();

    // Calculate current week start
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);
    const weekStartString = currentWeekStart.toISOString().split('T')[0];

    // Create assignment with null assigned_person
    await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore[0].id,
        week_start: weekStartString,
        assigned_person: null,
        is_completed: false,
        completed_at: null
      })
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].chore_name).toEqual('Simple chore');
    expect(result[0].chore_description).toBeNull();
    expect(result[0].assigned_person).toBeNull();
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].completed_at).toBeNull();
  });

  it('should calculate correct week start for different days of week', async () => {
    // Create test chore
    const chore = await db.insert(choresTable)
      .values({ name: 'Test chore', description: 'Test' })
      .returning()
      .execute();

    // Test the Monday calculation logic by checking what date gets used
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const expectedWeekStart = new Date(today);
    expectedWeekStart.setDate(today.getDate() - mondayOffset);
    expectedWeekStart.setHours(0, 0, 0, 0);
    const expectedWeekStartString = expectedWeekStart.toISOString().split('T')[0];

    // Create assignment for the calculated week start
    await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore[0].id,
        week_start: expectedWeekStartString,
        assigned_person: 'Test Person',
        is_completed: false,
        completed_at: null
      })
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].week_start.getTime()).toEqual(expectedWeekStart.getTime());
  });
});
