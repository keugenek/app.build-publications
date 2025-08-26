import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type GetWeeklyAssignmentsInput } from '../schema';
import { getWeeklyAssignments } from '../handlers/get_weekly_assignments';

describe('getWeeklyAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return weekly assignments with chore details', async () => {
    // Create test chores
    const choreResults = await db.insert(choresTable)
      .values([
        {
          name: 'Take out trash',
          description: 'Empty all wastebaskets and take to curb'
        },
        {
          name: 'Vacuum living room',
          description: 'Vacuum carpet and under furniture'
        }
      ])
      .returning()
      .execute();

    const weekStart = new Date('2024-01-01');
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Create test weekly assignments
    const assignmentResults = await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: choreResults[0].id,
          week_start: weekStartStr,
          assigned_person: 'Alice',
          is_completed: false,
          completed_at: null
        },
        {
          chore_id: choreResults[1].id,
          week_start: weekStartStr,
          assigned_person: 'Bob',
          is_completed: true,
          completed_at: new Date('2024-01-02T10:00:00Z')
        }
      ])
      .returning()
      .execute();

    const input: GetWeeklyAssignmentsInput = {
      week_start: weekStart
    };

    const result = await getWeeklyAssignments(input);

    // Should return 2 assignments
    expect(result).toHaveLength(2);

    // Check first assignment (incomplete)
    const trashAssignment = result.find(a => a.chore_name === 'Take out trash');
    expect(trashAssignment).toBeDefined();
    expect(trashAssignment!.assignment_id).toBe(assignmentResults[0].id);
    expect(trashAssignment!.chore_id).toBe(choreResults[0].id);
    expect(trashAssignment!.chore_name).toBe('Take out trash');
    expect(trashAssignment!.chore_description).toBe('Empty all wastebaskets and take to curb');
    expect(trashAssignment!.week_start).toEqual(weekStart);
    expect(trashAssignment!.assigned_person).toBe('Alice');
    expect(trashAssignment!.is_completed).toBe(false);
    expect(trashAssignment!.completed_at).toBeNull();

    // Check second assignment (completed)
    const vacuumAssignment = result.find(a => a.chore_name === 'Vacuum living room');
    expect(vacuumAssignment).toBeDefined();
    expect(vacuumAssignment!.assignment_id).toBe(assignmentResults[1].id);
    expect(vacuumAssignment!.chore_id).toBe(choreResults[1].id);
    expect(vacuumAssignment!.chore_name).toBe('Vacuum living room');
    expect(vacuumAssignment!.chore_description).toBe('Vacuum carpet and under furniture');
    expect(vacuumAssignment!.week_start).toEqual(weekStart);
    expect(vacuumAssignment!.assigned_person).toBe('Bob');
    expect(vacuumAssignment!.is_completed).toBe(true);
    expect(vacuumAssignment!.completed_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no assignments exist for the week', async () => {
    const input: GetWeeklyAssignmentsInput = {
      week_start: new Date('2024-01-01')
    };

    const result = await getWeeklyAssignments(input);

    expect(result).toHaveLength(0);
  });

  it('should handle assignments with null description and assigned_person', async () => {
    // Create test chore with null description
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Clean kitchen',
        description: null
      })
      .returning()
      .execute();

    const weekStart = new Date('2024-01-08');
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Create assignment with no assigned person
    await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: choreResult[0].id,
        week_start: weekStartStr,
        assigned_person: null,
        is_completed: false,
        completed_at: null
      })
      .execute();

    const input: GetWeeklyAssignmentsInput = {
      week_start: weekStart
    };

    const result = await getWeeklyAssignments(input);

    expect(result).toHaveLength(1);
    expect(result[0].chore_description).toBeNull();
    expect(result[0].assigned_person).toBeNull();
    expect(result[0].chore_name).toBe('Clean kitchen');
  });

  it('should only return assignments for the specific week', async () => {
    // Create test chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Mow lawn',
        description: 'Cut grass in front and back yard'
      })
      .returning()
      .execute();

    const week1 = new Date('2024-01-01');
    const week2 = new Date('2024-01-08');
    const week1Str = week1.toISOString().split('T')[0];
    const week2Str = week2.toISOString().split('T')[0];
    
    // Create assignments for different weeks
    await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: choreResult[0].id,
          week_start: week1Str,
          assigned_person: 'Alice',
          is_completed: false,
          completed_at: null
        },
        {
          chore_id: choreResult[0].id,
          week_start: week2Str,
          assigned_person: 'Bob',
          is_completed: true,
          completed_at: new Date('2024-01-10T14:00:00Z')
        }
      ])
      .execute();

    // Query for week1 only
    const input: GetWeeklyAssignmentsInput = {
      week_start: week1
    };

    const result = await getWeeklyAssignments(input);

    // Should only return assignment for week1
    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(week1);
    expect(result[0].assigned_person).toBe('Alice');
    expect(result[0].is_completed).toBe(false);
  });

  it('should handle multiple assignments for the same week', async () => {
    // Create multiple chores
    const choreResults = await db.insert(choresTable)
      .values([
        { name: 'Dishes', description: 'Wash and dry dishes' },
        { name: 'Laundry', description: 'Wash, dry, and fold clothes' },
        { name: 'Dusting', description: null }
      ])
      .returning()
      .execute();

    const weekStart = new Date('2024-01-15');
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Create assignments for all chores in the same week
    await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: choreResults[0].id,
          week_start: weekStartStr,
          assigned_person: 'Alice',
          is_completed: true,
          completed_at: new Date('2024-01-16T09:00:00Z')
        },
        {
          chore_id: choreResults[1].id,
          week_start: weekStartStr,
          assigned_person: 'Bob',
          is_completed: false,
          completed_at: null
        },
        {
          chore_id: choreResults[2].id,
          week_start: weekStartStr,
          assigned_person: null,
          is_completed: false,
          completed_at: null
        }
      ])
      .execute();

    const input: GetWeeklyAssignmentsInput = {
      week_start: weekStart
    };

    const result = await getWeeklyAssignments(input);

    // Should return all 3 assignments
    expect(result).toHaveLength(3);

    // Verify all assignments are for the correct week
    result.forEach(assignment => {
      expect(assignment.week_start).toEqual(weekStart);
    });

    // Verify we have all the expected chores
    const choreNames = result.map(a => a.chore_name).sort();
    expect(choreNames).toEqual(['Dishes', 'Dusting', 'Laundry']);
  });
});
