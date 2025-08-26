import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { type CreateWeeklyAssignmentInput } from '../schema';
import { createWeeklyAssignments } from '../handlers/create_weekly_assignments';
import { eq, and } from 'drizzle-orm';

// Test input for 2024 week 1
const testInput: CreateWeeklyAssignmentInput = {
  year: 2024,
  week_number: 1
};

describe('createWeeklyAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test participants
  const createTestParticipants = async () => {
    return await db.insert(participantsTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ])
      .returning()
      .execute();
  };

  // Helper function to create test chores
  const createTestChores = async () => {
    return await db.insert(choresTable)
      .values([
        { name: 'Dishes' },
        { name: 'Vacuum' },
        { name: 'Trash' },
        { name: 'Laundry' }
      ])
      .returning()
      .execute();
  };

  it('should create weekly assignments successfully', async () => {
    // Setup prerequisite data
    const participants = await createTestParticipants();
    const chores = await createTestChores();

    const result = await createWeeklyAssignments(testInput);

    // Verify basic properties
    expect(result).toHaveLength(chores.length);
    expect(result[0].week.year).toEqual(2024);
    expect(result[0].week.week_number).toEqual(1);

    // Verify all assignments have proper structure
    result.forEach(assignment => {
      expect(assignment.id).toBeDefined();
      expect(assignment.week).toBeDefined();
      expect(assignment.participant).toBeDefined();
      expect(assignment.chore).toBeDefined();
      expect(assignment.is_completed).toEqual(false);
      expect(assignment.completed_at).toBeNull();
      expect(assignment.created_at).toBeInstanceOf(Date);
    });

    // Verify all chores are assigned
    const assignedChoreIds = result.map(a => a.chore.id).sort();
    const choreIds = chores.map(c => c.id).sort();
    expect(assignedChoreIds).toEqual(choreIds);

    // Verify all participants are used (with 4 chores and 3 participants, one participant gets 2 chores)
    const assignedParticipantIds = result.map(a => a.participant.id);
    const uniqueParticipantIds = [...new Set(assignedParticipantIds)];
    expect(uniqueParticipantIds.length).toEqual(participants.length);
  });

  it('should create week record when it does not exist', async () => {
    await createTestParticipants();
    await createTestChores();

    await createWeeklyAssignments(testInput);

    // Verify week record was created
    const weeks = await db.select()
      .from(weeksTable)
      .where(and(
        eq(weeksTable.year, 2024),
        eq(weeksTable.week_number, 1)
      ))
      .execute();

    expect(weeks).toHaveLength(1);
    expect(weeks[0].year).toEqual(2024);
    expect(weeks[0].week_number).toEqual(1);
    expect(weeks[0].start_date).toBeDefined();
    expect(weeks[0].end_date).toBeDefined();
  });

  it('should use existing week record if it exists', async () => {
    await createTestParticipants();
    await createTestChores();

    // Create week record first
    const existingWeek = await db.insert(weeksTable)
      .values({
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      })
      .returning()
      .execute();

    const result = await createWeeklyAssignments(testInput);

    // Verify it used the existing week
    expect(result[0].week.id).toEqual(existingWeek[0].id);
    expect(result[0].week.start_date).toEqual(new Date('2024-01-01'));
    expect(result[0].week.end_date).toEqual(new Date('2024-01-07'));
  });

  it('should save assignments to database correctly', async () => {
    await createTestParticipants();
    const chores = await createTestChores();

    const result = await createWeeklyAssignments(testInput);

    // Query assignments from database
    const savedAssignments = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .where(and(
        eq(weeksTable.year, 2024),
        eq(weeksTable.week_number, 1)
      ))
      .execute();

    expect(savedAssignments).toHaveLength(chores.length);
    
    // Verify each assignment is properly saved
    savedAssignments.forEach(saved => {
      expect(saved.assignments.week_id).toBeDefined();
      expect(saved.assignments.participant_id).toBeDefined();
      expect(saved.assignments.chore_id).toBeDefined();
      expect(saved.assignments.is_completed).toEqual(false);
      expect(saved.assignments.completed_at).toBeNull();
      expect(saved.assignments.created_at).toBeInstanceOf(Date);
    });
  });

  it('should distribute chores evenly among participants', async () => {
    const participants = await createTestParticipants(); // 3 participants
    await createTestChores(); // 4 chores

    const result = await createWeeklyAssignments(testInput);

    // Count assignments per participant
    const assignmentCounts = result.reduce((counts, assignment) => {
      const participantId = assignment.participant.id;
      counts[participantId] = (counts[participantId] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    // With 4 chores and 3 participants, distribution should be as even as possible
    const counts = Object.values(assignmentCounts);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    expect(counts.reduce((sum, count) => sum + count, 0)).toEqual(4);
  });

  it('should handle single participant and multiple chores', async () => {
    // Create only one participant
    await db.insert(participantsTable)
      .values({ name: 'Solo Worker' })
      .returning()
      .execute();

    const chores = await createTestChores(); // 4 chores

    const result = await createWeeklyAssignments(testInput);

    expect(result).toHaveLength(chores.length);
    
    // All chores should be assigned to the single participant
    const uniqueParticipantIds = [...new Set(result.map(a => a.participant.id))];
    expect(uniqueParticipantIds).toHaveLength(1);
  });

  it('should throw error when no participants exist', async () => {
    await createTestChores();

    expect(createWeeklyAssignments(testInput))
      .rejects
      .toThrow(/no participants available/i);
  });

  it('should throw error when no chores exist', async () => {
    await createTestParticipants();

    expect(createWeeklyAssignments(testInput))
      .rejects
      .toThrow(/no chores available/i);
  });

  it('should throw error when assignments already exist for the week', async () => {
    const participants = await createTestParticipants();
    const chores = await createTestChores();

    // Create assignments first time
    await createWeeklyAssignments(testInput);

    // Try to create assignments again for the same week
    expect(createWeeklyAssignments(testInput))
      .rejects
      .toThrow(/assignments already exist/i);
  });

  it('should handle different weeks correctly', async () => {
    await createTestParticipants();
    await createTestChores();

    // Create assignments for week 1
    const week1Result = await createWeeklyAssignments({
      year: 2024,
      week_number: 1
    });

    // Create assignments for week 2
    const week2Result = await createWeeklyAssignments({
      year: 2024,
      week_number: 2
    });

    expect(week1Result[0].week.week_number).toEqual(1);
    expect(week2Result[0].week.week_number).toEqual(2);
    
    // Verify both sets of assignments exist in database
    const allAssignments = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .execute();

    const week1Assignments = allAssignments.filter(a => a.weeks.week_number === 1);
    const week2Assignments = allAssignments.filter(a => a.weeks.week_number === 2);
    
    expect(week1Assignments.length).toBeGreaterThan(0);
    expect(week2Assignments.length).toBeGreaterThan(0);
  });

  it('should calculate week dates correctly', async () => {
    await createTestParticipants();
    await createTestChores();

    const result = await createWeeklyAssignments({
      year: 2024,
      week_number: 10
    });

    const week = result[0].week;
    expect(week.start_date).toBeInstanceOf(Date);
    expect(week.end_date).toBeInstanceOf(Date);
    
    // End date should be 6 days after start date
    const daysDifference = (week.end_date.getTime() - week.start_date.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDifference).toEqual(6);
    
    // Start date should be a Monday (getDay() returns 1 for Monday)
    expect(week.start_date.getDay()).toEqual(1);
    
    // End date should be a Sunday (getDay() returns 0 for Sunday)
    expect(week.end_date.getDay()).toEqual(0);
  });
});
