import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { type GetAssignmentsByWeekInput } from '../schema';
import { getAssignmentsByWeek } from '../handlers/get_assignments_by_week';

describe('getAssignmentsByWeek', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  async function createTestData() {
    // Create participants
    const [participant1, participant2] = await db.insert(participantsTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' }
      ])
      .returning()
      .execute();

    // Create chores
    const [chore1, chore2, chore3] = await db.insert(choresTable)
      .values([
        { name: 'Vacuum' },
        { name: 'Dishes' },
        { name: 'Trash' }
      ])
      .returning()
      .execute();

    // Create weeks
    const [week1, week2] = await db.insert(weeksTable)
      .values([
        {
          year: 2024,
          week_number: 15,
          start_date: '2024-04-08',
          end_date: '2024-04-14'
        },
        {
          year: 2024,
          week_number: 16,
          start_date: '2024-04-15',
          end_date: '2024-04-21'
        }
      ])
      .returning()
      .execute();

    return { participant1, participant2, chore1, chore2, chore3, week1, week2 };
  }

  it('should return assignments for a specific week with complete details', async () => {
    const testData = await createTestData();

    // Create assignments for week 15
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: testData.week1.id,
          participant_id: testData.participant1.id,
          chore_id: testData.chore1.id,
          is_completed: false
        },
        {
          week_id: testData.week1.id,
          participant_id: testData.participant2.id,
          chore_id: testData.chore2.id,
          is_completed: true,
          completed_at: new Date()
        }
      ])
      .execute();

    const input: GetAssignmentsByWeekInput = {
      year: 2024,
      week_number: 15
    };

    const result = await getAssignmentsByWeek(input);

    expect(result).toHaveLength(2);

    // Verify assignment structure and data
    const assignment1 = result.find(a => a.chore.name === 'Vacuum');
    expect(assignment1).toBeDefined();
    expect(assignment1?.participant.name).toEqual('Alice');
    expect(assignment1?.is_completed).toEqual(false);
    expect(assignment1?.completed_at).toBeNull();
    expect(assignment1?.week.year).toEqual(2024);
    expect(assignment1?.week.week_number).toEqual(15);
    expect(assignment1?.week.start_date).toEqual(new Date('2024-04-08'));
    expect(assignment1?.week.end_date).toEqual(new Date('2024-04-14'));

    const assignment2 = result.find(a => a.chore.name === 'Dishes');
    expect(assignment2).toBeDefined();
    expect(assignment2?.participant.name).toEqual('Bob');
    expect(assignment2?.is_completed).toEqual(true);
    expect(assignment2?.completed_at).toBeInstanceOf(Date);

    // Verify all nested objects have required fields
    result.forEach(assignment => {
      expect(assignment.id).toBeDefined();
      expect(assignment.created_at).toBeInstanceOf(Date);
      
      // Week details
      expect(assignment.week.id).toBeDefined();
      expect(assignment.week.created_at).toBeInstanceOf(Date);
      
      // Participant details
      expect(assignment.participant.id).toBeDefined();
      expect(assignment.participant.created_at).toBeInstanceOf(Date);
      
      // Chore details
      expect(assignment.chore.id).toBeDefined();
      expect(assignment.chore.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no assignments exist for the week', async () => {
    const testData = await createTestData();

    // Create assignments for week 15, but query week 16
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: testData.week1.id,
          participant_id: testData.participant1.id,
          chore_id: testData.chore1.id,
          is_completed: false
        }
      ])
      .execute();

    const input: GetAssignmentsByWeekInput = {
      year: 2024,
      week_number: 16
    };

    const result = await getAssignmentsByWeek(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when week does not exist', async () => {
    await createTestData();

    const input: GetAssignmentsByWeekInput = {
      year: 2024,
      week_number: 99 // Non-existent week
    };

    const result = await getAssignmentsByWeek(input);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple assignments for different participants and chores in the same week', async () => {
    const testData = await createTestData();

    // Create multiple assignments for the same week
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: testData.week1.id,
          participant_id: testData.participant1.id,
          chore_id: testData.chore1.id,
          is_completed: false
        },
        {
          week_id: testData.week1.id,
          participant_id: testData.participant1.id,
          chore_id: testData.chore2.id,
          is_completed: true,
          completed_at: new Date('2024-04-10T10:30:00Z')
        },
        {
          week_id: testData.week1.id,
          participant_id: testData.participant2.id,
          chore_id: testData.chore3.id,
          is_completed: false
        }
      ])
      .execute();

    const input: GetAssignmentsByWeekInput = {
      year: 2024,
      week_number: 15
    };

    const result = await getAssignmentsByWeek(input);

    expect(result).toHaveLength(3);

    // Verify we get assignments for both participants
    const aliceAssignments = result.filter(a => a.participant.name === 'Alice');
    const bobAssignments = result.filter(a => a.participant.name === 'Bob');
    
    expect(aliceAssignments).toHaveLength(2);
    expect(bobAssignments).toHaveLength(1);

    // Verify chore variety
    const choreNames = result.map(a => a.chore.name).sort();
    expect(choreNames).toEqual(['Dishes', 'Trash', 'Vacuum']);

    // Verify completion statuses
    const completedAssignments = result.filter(a => a.is_completed);
    const incompleteAssignments = result.filter(a => !a.is_completed);
    
    expect(completedAssignments).toHaveLength(1);
    expect(incompleteAssignments).toHaveLength(2);
    expect(completedAssignments[0].chore.name).toEqual('Dishes');
  });

  it('should filter by both year and week_number correctly', async () => {
    const testData = await createTestData();

    // Create another week in a different year
    const [week2025] = await db.insert(weeksTable)
      .values([
        {
          year: 2025,
          week_number: 15, // Same week number, different year
          start_date: '2025-04-07',
          end_date: '2025-04-13'
        }
      ])
      .returning()
      .execute();

    // Create assignments for both weeks
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: testData.week1.id, // 2024, week 15
          participant_id: testData.participant1.id,
          chore_id: testData.chore1.id,
          is_completed: false
        },
        {
          week_id: week2025.id, // 2025, week 15
          participant_id: testData.participant2.id,
          chore_id: testData.chore2.id,
          is_completed: false
        }
      ])
      .execute();

    // Query for 2024, week 15
    const result2024 = await getAssignmentsByWeek({
      year: 2024,
      week_number: 15
    });

    // Query for 2025, week 15
    const result2025 = await getAssignmentsByWeek({
      year: 2025,
      week_number: 15
    });

    expect(result2024).toHaveLength(1);
    expect(result2025).toHaveLength(1);

    expect(result2024[0].week.year).toEqual(2024);
    expect(result2024[0].participant.name).toEqual('Alice');

    expect(result2025[0].week.year).toEqual(2025);
    expect(result2025[0].participant.name).toEqual('Bob');
  });
});
