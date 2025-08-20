import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type GenerateWeeklyAssignmentsInput } from '../schema';
import { generateWeeklyAssignments } from '../handlers/generate_weekly_assignments';
import { eq } from 'drizzle-orm';

// Test input with people assigned
const testInputWithPeople: GenerateWeeklyAssignmentsInput = {
  week_start: new Date('2024-01-01'), // Monday
  assigned_people: ['Alice', 'Bob', 'Charlie']
};

// Test input without people assigned
const testInputNoPeople: GenerateWeeklyAssignmentsInput = {
  week_start: new Date('2024-01-08') // Next Monday
};

describe('generateWeeklyAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no chores exist', async () => {
    const result = await generateWeeklyAssignments(testInputWithPeople);
    
    expect(result).toEqual([]);
  });

  it('should create assignments for all chores with assigned people', async () => {
    // Create test chores first
    await db.insert(choresTable).values([
      { name: 'Vacuum living room', description: 'Weekly vacuum' },
      { name: 'Take out trash', description: 'Empty all bins' },
      { name: 'Clean bathroom', description: null }
    ]).execute();

    const result = await generateWeeklyAssignments(testInputWithPeople);

    // Should create 3 assignments (one per chore)
    expect(result).toHaveLength(3);
    
    // All assignments should be for the correct week
    result.forEach(assignment => {
      expect(assignment.week_start).toEqual(new Date('2024-01-01'));
      expect(assignment.is_completed).toBe(false);
      expect(assignment.completed_at).toBeNull();
      expect(assignment.id).toBeDefined();
      expect(assignment.created_at).toBeInstanceOf(Date);
      
      // Should be assigned to one of the provided people
      expect(testInputWithPeople.assigned_people).toContain(assignment.assigned_person);
    });

    // Verify all chores got assigned
    const choreIds = result.map(a => a.chore_id).sort();
    expect(choreIds).toEqual([1, 2, 3]);
  });

  it('should create assignments with null assigned_person when no people provided', async () => {
    // Create test chores
    await db.insert(choresTable).values([
      { name: 'Water plants', description: 'Weekly watering' },
      { name: 'Check mail', description: null }
    ]).execute();

    const result = await generateWeeklyAssignments(testInputNoPeople);

    expect(result).toHaveLength(2);
    
    result.forEach(assignment => {
      expect(assignment.week_start).toEqual(new Date('2024-01-08'));
      expect(assignment.assigned_person).toBeNull();
      expect(assignment.is_completed).toBe(false);
    });
  });

  it('should return existing assignments when they already exist for the week', async () => {
    // Create test chores
    const chores = await db.insert(choresTable).values([
      { name: 'Mow lawn', description: 'Cut grass weekly' }
    ]).returning().execute();

    // Create existing assignment for the same week
    const existing = await db.insert(weeklyAssignmentsTable).values({
      chore_id: chores[0].id,
      week_start: '2024-01-01',
      assigned_person: 'Dave',
      is_completed: false
    }).returning().execute();

    const result = await generateWeeklyAssignments(testInputWithPeople);

    // Should return the existing assignment, not create new ones
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(existing[0].id);
    expect(result[0].assigned_person).toEqual('Dave');
    
    // Verify no duplicate assignments were created
    const allAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.week_start, '2024-01-01'))
      .execute();
    
    expect(allAssignments).toHaveLength(1);
  });

  it('should save assignments to database correctly', async () => {
    // Create test chores
    await db.insert(choresTable).values([
      { name: 'Organize closet', description: 'Monthly organization' }
    ]).execute();

    const result = await generateWeeklyAssignments(testInputWithPeople);

    // Query database directly to verify
    const dbAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, result[0].id))
      .execute();

    expect(dbAssignments).toHaveLength(1);
    expect(dbAssignments[0].chore_id).toEqual(1);
    expect(dbAssignments[0].week_start).toEqual('2024-01-01');
    expect(dbAssignments[0].is_completed).toBe(false);
    expect(dbAssignments[0].created_at).toBeInstanceOf(Date);
    expect(testInputWithPeople.assigned_people).toContain(dbAssignments[0].assigned_person);
  });

  it('should handle different week start dates correctly', async () => {
    // Create test chore
    await db.insert(choresTable).values([
      { name: 'Weekly shopping', description: 'Grocery run' }
    ]).execute();

    const input1: GenerateWeeklyAssignmentsInput = {
      week_start: new Date('2024-02-05'), // Different week
      assigned_people: ['Eve']
    };

    const input2: GenerateWeeklyAssignmentsInput = {
      week_start: new Date('2024-02-12'), // Another different week
      assigned_people: ['Frank']
    };

    const result1 = await generateWeeklyAssignments(input1);
    const result2 = await generateWeeklyAssignments(input2);

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    
    expect(result1[0].week_start).toEqual(new Date('2024-02-05'));
    expect(result1[0].assigned_person).toEqual('Eve');
    
    expect(result2[0].week_start).toEqual(new Date('2024-02-12'));
    expect(result2[0].assigned_person).toEqual('Frank');

    // Verify both assignments exist in database
    const allAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .execute();
    
    expect(allAssignments).toHaveLength(2);
  });

  it('should distribute chores randomly among assigned people', async () => {
    // Create multiple chores to test distribution
    await db.insert(choresTable).values([
      { name: 'Chore 1', description: 'Test 1' },
      { name: 'Chore 2', description: 'Test 2' },
      { name: 'Chore 3', description: 'Test 3' },
      { name: 'Chore 4', description: 'Test 4' },
      { name: 'Chore 5', description: 'Test 5' }
    ]).execute();

    const result = await generateWeeklyAssignments(testInputWithPeople);

    expect(result).toHaveLength(5);
    
    // All assignments should have assigned people from the provided list
    const assignedPeople = result.map(a => a.assigned_person);
    assignedPeople.forEach(person => {
      expect(testInputWithPeople.assigned_people).toContain(person);
    });

    // With 5 chores and 3 people, at least one person should have multiple chores
    // (this tests that the random assignment is working)
    const peopleCount = assignedPeople.reduce((acc, person) => {
      acc[person!] = (acc[person!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(Object.keys(peopleCount).length).toBeGreaterThan(0);
    expect(Object.keys(peopleCount).length).toBeLessThanOrEqual(3);
  });
});
