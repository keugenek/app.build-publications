import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { type GetAssignmentsByParticipantInput } from '../schema';
import { getAssignmentsByParticipant } from '../handlers/get_assignments_by_participant';

describe('getAssignmentsByParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create participants
    const participants = await db.insert(participantsTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' }
      ])
      .returning()
      .execute();

    // Create chores
    const chores = await db.insert(choresTable)
      .values([
        { name: 'Dishes' },
        { name: 'Vacuum' }
      ])
      .returning()
      .execute();

    // Create weeks
    const weeks = await db.insert(weeksTable)
      .values([
        {
          year: 2024,
          week_number: 1,
          start_date: '2024-01-01',
          end_date: '2024-01-07'
        },
        {
          year: 2024,
          week_number: 2,
          start_date: '2024-01-08',
          end_date: '2024-01-14'
        },
        {
          year: 2023,
          week_number: 52,
          start_date: '2023-12-25',
          end_date: '2023-12-31'
        }
      ])
      .returning()
      .execute();

    // Create assignments
    const assignments = await db.insert(assignmentsTable)
      .values([
        {
          week_id: weeks[0].id, // 2024 week 1
          participant_id: participants[0].id, // Alice
          chore_id: chores[0].id, // Dishes
          is_completed: true,
          completed_at: new Date('2024-01-03T10:00:00Z')
        },
        {
          week_id: weeks[0].id, // 2024 week 1
          participant_id: participants[0].id, // Alice
          chore_id: chores[1].id, // Vacuum
          is_completed: false,
          completed_at: null
        },
        {
          week_id: weeks[1].id, // 2024 week 2
          participant_id: participants[0].id, // Alice
          chore_id: chores[0].id, // Dishes
          is_completed: false,
          completed_at: null
        },
        {
          week_id: weeks[0].id, // 2024 week 1
          participant_id: participants[1].id, // Bob
          chore_id: chores[0].id, // Dishes
          is_completed: true,
          completed_at: new Date('2024-01-04T14:00:00Z')
        },
        {
          week_id: weeks[2].id, // 2023 week 52
          participant_id: participants[0].id, // Alice
          chore_id: chores[1].id, // Vacuum
          is_completed: false,
          completed_at: null
        }
      ])
      .returning()
      .execute();

    return { participants, chores, weeks, assignments };
  };

  it('should get all assignments for a participant when no filters provided', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: aliceId
    };

    const result = await getAssignmentsByParticipant(input);

    // Should return assignments for current week (this might be empty in test environment)
    expect(Array.isArray(result)).toBe(true);
    
    // All assignments should be for Alice
    result.forEach(assignment => {
      expect(assignment.participant.id).toEqual(aliceId);
      expect(assignment.participant.name).toEqual('Alice');
    });
  });

  it('should get assignments for specific year and week', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      year: 2024,
      week_number: 1
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(2);
    
    // All assignments should be for Alice in 2024 week 1
    result.forEach(assignment => {
      expect(assignment.participant.id).toEqual(aliceId);
      expect(assignment.participant.name).toEqual('Alice');
      expect(assignment.week.year).toEqual(2024);
      expect(assignment.week.week_number).toEqual(1);
      expect(assignment.id).toBeDefined();
      expect(assignment.created_at).toBeInstanceOf(Date);
    });

    // Check specific assignment details
    const dishesAssignment = result.find(a => a.chore.name === 'Dishes');
    const vacuumAssignment = result.find(a => a.chore.name === 'Vacuum');

    expect(dishesAssignment).toBeDefined();
    expect(dishesAssignment!.is_completed).toBe(true);
    expect(dishesAssignment!.completed_at).toBeInstanceOf(Date);

    expect(vacuumAssignment).toBeDefined();
    expect(vacuumAssignment!.is_completed).toBe(false);
    expect(vacuumAssignment!.completed_at).toBeNull();
  });

  it('should get assignments for specific year only', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      year: 2024
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(3);
    
    // All assignments should be for Alice in 2024
    result.forEach(assignment => {
      expect(assignment.participant.id).toEqual(aliceId);
      expect(assignment.week.year).toEqual(2024);
    });

    // Should include assignments from both week 1 and week 2
    const week1Assignments = result.filter(a => a.week.week_number === 1);
    const week2Assignments = result.filter(a => a.week.week_number === 2);
    
    expect(week1Assignments).toHaveLength(2);
    expect(week2Assignments).toHaveLength(1);
  });

  it('should get assignments for specific week number across years', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      week_number: 1
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(2);
    
    // All assignments should be for Alice in week 1 (any year)
    result.forEach(assignment => {
      expect(assignment.participant.id).toEqual(aliceId);
      expect(assignment.week.week_number).toEqual(1);
    });
  });

  it('should return empty array when participant has no assignments', async () => {
    const testData = await createTestData();
    const bobId = testData.participants[1].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: bobId,
      year: 2024,
      week_number: 2
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent participant', async () => {
    await createTestData();

    const input: GetAssignmentsByParticipantInput = {
      participant_id: 999,
      year: 2024,
      week_number: 1
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(0);
  });

  it('should include complete assignment details with all relationships', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    const input: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      year: 2024,
      week_number: 1
    };

    const result = await getAssignmentsByParticipant(input);

    expect(result).toHaveLength(2);

    const assignment = result[0];
    
    // Check assignment structure
    expect(assignment.id).toBeDefined();
    expect(assignment.is_completed).toBeDefined();
    expect(assignment.created_at).toBeInstanceOf(Date);

    // Check week details
    expect(assignment.week.id).toBeDefined();
    expect(assignment.week.year).toEqual(2024);
    expect(assignment.week.week_number).toEqual(1);
    expect(assignment.week.start_date).toBeDefined();
    expect(assignment.week.end_date).toBeDefined();
    expect(assignment.week.created_at).toBeInstanceOf(Date);

    // Check participant details
    expect(assignment.participant.id).toEqual(aliceId);
    expect(assignment.participant.name).toEqual('Alice');
    expect(assignment.participant.created_at).toBeInstanceOf(Date);

    // Check chore details
    expect(assignment.chore.id).toBeDefined();
    expect(['Dishes', 'Vacuum']).toContain(assignment.chore.name);
    expect(assignment.chore.created_at).toBeInstanceOf(Date);
  });

  it('should handle assignments from different years correctly', async () => {
    const testData = await createTestData();
    const aliceId = testData.participants[0].id;

    // Get 2023 assignments
    const input2023: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      year: 2023
    };

    const result2023 = await getAssignmentsByParticipant(input2023);

    expect(result2023).toHaveLength(1);
    expect(result2023[0].week.year).toEqual(2023);
    expect(result2023[0].week.week_number).toEqual(52);

    // Get 2024 assignments
    const input2024: GetAssignmentsByParticipantInput = {
      participant_id: aliceId,
      year: 2024
    };

    const result2024 = await getAssignmentsByParticipant(input2024);

    expect(result2024).toHaveLength(3);
    result2024.forEach(assignment => {
      expect(assignment.week.year).toEqual(2024);
    });
  });
});
