import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, choresTable, assignmentsTable } from '../db/schema';
import { type MarkAssignmentCompletedInput } from '../schema';
import { markAssignmentCompleted } from '../handlers/mark_assignment_completed';
import { eq } from 'drizzle-orm';

// Test data
const testMember = {
  name: 'Test Member'
};

const testChore = {
  name: 'Test Chore',
  description: 'A chore for testing'
};

const testAssignment = {
  chore_id: 0, // Will be set after chore creation
  member_id: 0, // Will be set after member creation
  week_start: '2024-01-01', // Monday as string for date column
  is_completed: false
};

describe('markAssignmentCompleted', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark assignment as completed', async () => {
    // Create prerequisite data
    const member = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();

    const assignment = await db.insert(assignmentsTable)
      .values({
        ...testAssignment,
        chore_id: chore[0].id,
        member_id: member[0].id
      })
      .returning()
      .execute();

    const input: MarkAssignmentCompletedInput = {
      assignment_id: assignment[0].id
    };

    const result = await markAssignmentCompleted(input);

    // Verify the assignment is marked as completed
    expect(result.id).toEqual(assignment[0].id);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.chore_id).toEqual(chore[0].id);
    expect(result.member_id).toEqual(member[0].id);
    expect(result.week_start).toEqual(new Date('2024-01-01'));
  });

  it('should update assignment in database', async () => {
    // Create prerequisite data
    const member = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();

    const assignment = await db.insert(assignmentsTable)
      .values({
        ...testAssignment,
        chore_id: chore[0].id,
        member_id: member[0].id
      })
      .returning()
      .execute();

    const input: MarkAssignmentCompletedInput = {
      assignment_id: assignment[0].id
    };

    // Mark assignment as completed
    await markAssignmentCompleted(input);

    // Verify in database
    const updatedAssignment = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignment[0].id))
      .execute();

    expect(updatedAssignment).toHaveLength(1);
    expect(updatedAssignment[0].is_completed).toBe(true);
    expect(updatedAssignment[0].completed_at).toBeInstanceOf(Date);
    expect(updatedAssignment[0].id).toEqual(assignment[0].id);
  });

  it('should throw error when assignment does not exist', async () => {
    const input: MarkAssignmentCompletedInput = {
      assignment_id: 999 // Non-existent assignment
    };

    await expect(markAssignmentCompleted(input)).rejects.toThrow(/Assignment with id 999 not found/i);
  });

  it('should handle already completed assignment', async () => {
    // Create prerequisite data
    const member = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();

    // Create assignment that's already completed
    const completedDate = new Date('2024-01-05');
    const assignment = await db.insert(assignmentsTable)
      .values({
        ...testAssignment,
        chore_id: chore[0].id,
        member_id: member[0].id,
        is_completed: true,
        completed_at: completedDate
      })
      .returning()
      .execute();

    const input: MarkAssignmentCompletedInput = {
      assignment_id: assignment[0].id
    };

    const result = await markAssignmentCompleted(input);

    // Should still work and update the completed_at timestamp
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toEqual(completedDate); // Should be updated to current time
  });

  it('should preserve other assignment fields when marking completed', async () => {
    // Create prerequisite data
    const member = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();

    const assignment = await db.insert(assignmentsTable)
      .values({
        ...testAssignment,
        chore_id: chore[0].id,
        member_id: member[0].id
      })
      .returning()
      .execute();

    const input: MarkAssignmentCompletedInput = {
      assignment_id: assignment[0].id
    };

    const result = await markAssignmentCompleted(input);

    // Verify all original fields are preserved
    expect(result.chore_id).toEqual(chore[0].id);
    expect(result.member_id).toEqual(member[0].id);
    expect(result.week_start).toEqual(new Date(assignment[0].week_start));
    expect(result.created_at).toEqual(assignment[0].created_at);
    expect(result.id).toEqual(assignment[0].id);
    
    // Only these fields should be updated
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });
});
