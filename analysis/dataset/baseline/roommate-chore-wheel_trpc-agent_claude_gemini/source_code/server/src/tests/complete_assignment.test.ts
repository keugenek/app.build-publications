import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { type CompleteAssignmentInput } from '../schema';
import { completeAssignment } from '../handlers/complete_assignment';
import { eq } from 'drizzle-orm';

// Test data setup
const testParticipant = {
  name: 'Test Participant'
};

const testChore = {
  name: 'Test Chore'
};

const testWeek = {
  year: 2024,
  week_number: 1,
  start_date: '2024-01-01',
  end_date: '2024-01-07'
};

describe('completeAssignment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark an assignment as completed', async () => {
    // Create prerequisite data
    const participants = await db.insert(participantsTable)
      .values(testParticipant)
      .returning()
      .execute();
    
    const chores = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const weeks = await db.insert(weeksTable)
      .values(testWeek)
      .returning()
      .execute();

    // Create assignment
    const assignments = await db.insert(assignmentsTable)
      .values({
        week_id: weeks[0].id,
        participant_id: participants[0].id,
        chore_id: chores[0].id,
        is_completed: false,
        completed_at: null
      })
      .returning()
      .execute();

    const input: CompleteAssignmentInput = {
      assignment_id: assignments[0].id
    };

    // Execute the handler
    const result = await completeAssignment(input);

    // Verify the result structure and completion status
    expect(result.id).toEqual(assignments[0].id);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify week details
    expect(result.week.id).toEqual(weeks[0].id);
    expect(result.week.year).toEqual(2024);
    expect(result.week.week_number).toEqual(1);
    expect(result.week.start_date).toBeInstanceOf(Date);
    expect(result.week.end_date).toBeInstanceOf(Date);

    // Verify participant details
    expect(result.participant.id).toEqual(participants[0].id);
    expect(result.participant.name).toEqual('Test Participant');
    expect(result.participant.created_at).toBeInstanceOf(Date);

    // Verify chore details
    expect(result.chore.id).toEqual(chores[0].id);
    expect(result.chore.name).toEqual('Test Chore');
    expect(result.chore.created_at).toBeInstanceOf(Date);
  });

  it('should update assignment in database', async () => {
    // Create prerequisite data
    const participants = await db.insert(participantsTable)
      .values(testParticipant)
      .returning()
      .execute();
    
    const chores = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const weeks = await db.insert(weeksTable)
      .values(testWeek)
      .returning()
      .execute();

    // Create assignment
    const assignments = await db.insert(assignmentsTable)
      .values({
        week_id: weeks[0].id,
        participant_id: participants[0].id,
        chore_id: chores[0].id,
        is_completed: false,
        completed_at: null
      })
      .returning()
      .execute();

    const input: CompleteAssignmentInput = {
      assignment_id: assignments[0].id
    };

    // Execute the handler
    await completeAssignment(input);

    // Query the database to verify the update
    const updatedAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignments[0].id))
      .execute();

    expect(updatedAssignments).toHaveLength(1);
    expect(updatedAssignments[0].is_completed).toBe(true);
    expect(updatedAssignments[0].completed_at).toBeInstanceOf(Date);
    expect(updatedAssignments[0].completed_at).not.toBeNull();
  });

  it('should throw error for non-existent assignment', async () => {
    const input: CompleteAssignmentInput = {
      assignment_id: 999999 // Non-existent ID
    };

    await expect(completeAssignment(input)).rejects.toThrow(/Assignment with ID 999999 not found/i);
  });

  it('should throw error for already completed assignment', async () => {
    // Create prerequisite data
    const participants = await db.insert(participantsTable)
      .values(testParticipant)
      .returning()
      .execute();
    
    const chores = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const weeks = await db.insert(weeksTable)
      .values(testWeek)
      .returning()
      .execute();

    // Create already completed assignment
    const completedAt = new Date();
    const assignments = await db.insert(assignmentsTable)
      .values({
        week_id: weeks[0].id,
        participant_id: participants[0].id,
        chore_id: chores[0].id,
        is_completed: true,
        completed_at: completedAt
      })
      .returning()
      .execute();

    const input: CompleteAssignmentInput = {
      assignment_id: assignments[0].id
    };

    await expect(completeAssignment(input)).rejects.toThrow(/Assignment with ID \d+ is already completed/i);
  });

  it('should handle multiple assignments correctly', async () => {
    // Create prerequisite data
    const participants = await db.insert(participantsTable)
      .values([
        { name: 'Participant 1' },
        { name: 'Participant 2' }
      ])
      .returning()
      .execute();
    
    const chores = await db.insert(choresTable)
      .values([
        { name: 'Chore 1' },
        { name: 'Chore 2' }
      ])
      .returning()
      .execute();
    
    const weeks = await db.insert(weeksTable)
      .values(testWeek)
      .returning()
      .execute();

    // Create multiple assignments
    const assignments = await db.insert(assignmentsTable)
      .values([
        {
          week_id: weeks[0].id,
          participant_id: participants[0].id,
          chore_id: chores[0].id,
          is_completed: false,
          completed_at: null
        },
        {
          week_id: weeks[0].id,
          participant_id: participants[1].id,
          chore_id: chores[1].id,
          is_completed: false,
          completed_at: null
        }
      ])
      .returning()
      .execute();

    // Complete first assignment
    const input1: CompleteAssignmentInput = {
      assignment_id: assignments[0].id
    };

    const result1 = await completeAssignment(input1);

    // Verify first assignment is completed
    expect(result1.id).toEqual(assignments[0].id);
    expect(result1.is_completed).toBe(true);
    expect(result1.participant.name).toEqual('Participant 1');
    expect(result1.chore.name).toEqual('Chore 1');

    // Complete second assignment
    const input2: CompleteAssignmentInput = {
      assignment_id: assignments[1].id
    };

    const result2 = await completeAssignment(input2);

    // Verify second assignment is completed
    expect(result2.id).toEqual(assignments[1].id);
    expect(result2.is_completed).toBe(true);
    expect(result2.participant.name).toEqual('Participant 2');
    expect(result2.chore.name).toEqual('Chore 2');

    // Verify both assignments are completed in database
    const allAssignments = await db.select()
      .from(assignmentsTable)
      .execute();

    expect(allAssignments).toHaveLength(2);
    allAssignments.forEach(assignment => {
      expect(assignment.is_completed).toBe(true);
      expect(assignment.completed_at).toBeInstanceOf(Date);
      expect(assignment.completed_at).not.toBeNull();
    });
  });

  it('should preserve original assignment creation time', async () => {
    // Create prerequisite data
    const participants = await db.insert(participantsTable)
      .values(testParticipant)
      .returning()
      .execute();
    
    const chores = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const weeks = await db.insert(weeksTable)
      .values(testWeek)
      .returning()
      .execute();

    // Create assignment
    const assignments = await db.insert(assignmentsTable)
      .values({
        week_id: weeks[0].id,
        participant_id: participants[0].id,
        chore_id: chores[0].id,
        is_completed: false,
        completed_at: null
      })
      .returning()
      .execute();

    const originalCreatedAt = assignments[0].created_at;

    // Wait a small amount to ensure completion time is different
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: CompleteAssignmentInput = {
      assignment_id: assignments[0].id
    };

    const result = await completeAssignment(input);

    // Verify original creation time is preserved
    expect(result.created_at).toEqual(originalCreatedAt);
    
    // Verify completion time is different and recent
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at!.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});
