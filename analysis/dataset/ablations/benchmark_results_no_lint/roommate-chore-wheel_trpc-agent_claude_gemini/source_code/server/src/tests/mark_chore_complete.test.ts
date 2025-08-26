import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type MarkChoreCompleteInput } from '../schema';
import { markChoreComplete } from '../handlers/mark_chore_complete';
import { eq } from 'drizzle-orm';

describe('markChoreComplete', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark a chore assignment as complete', async () => {
    // Create a test chore first
    const [chore] = await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        description: 'A chore for testing'
      })
      .returning()
      .execute();

    // Create a weekly assignment
    const [assignment] = await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore.id,
        week_start: '2024-01-01',
        assigned_person: 'John Doe',
        is_completed: false
      })
      .returning()
      .execute();

    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    const result = await markChoreComplete(input);

    // Verify the result
    expect(result.id).toEqual(assignment.id);
    expect(result.chore_id).toEqual(chore.id);
    expect(result.assigned_person).toEqual('John Doe');
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.week_start).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update the assignment in the database', async () => {
    // Create a test chore first
    const [chore] = await db.insert(choresTable)
      .values({
        name: 'Database Test Chore',
        description: 'Testing database updates'
      })
      .returning()
      .execute();

    // Create a weekly assignment
    const [assignment] = await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore.id,
        week_start: '2024-01-08',
        assigned_person: 'Jane Smith',
        is_completed: false
      })
      .returning()
      .execute();

    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    const completionTime = new Date();
    await markChoreComplete(input);

    // Query the database to verify the update
    const [updatedAssignment] = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, assignment.id))
      .execute();

    expect(updatedAssignment.is_completed).toBe(true);
    expect(updatedAssignment.completed_at).toBeInstanceOf(Date);
    expect(updatedAssignment.completed_at!.getTime()).toBeGreaterThanOrEqual(completionTime.getTime() - 1000); // Within 1 second
    expect(updatedAssignment.assigned_person).toEqual('Jane Smith');
    expect(updatedAssignment.chore_id).toEqual(chore.id);
  });

  it('should handle assignment with null assigned_person', async () => {
    // Create a test chore
    const [chore] = await db.insert(choresTable)
      .values({
        name: 'Unassigned Chore',
        description: 'A chore with no specific person assigned'
      })
      .returning()
      .execute();

    // Create a weekly assignment with no assigned person
    const [assignment] = await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore.id,
        week_start: '2024-01-15',
        assigned_person: null,
        is_completed: false
      })
      .returning()
      .execute();

    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    const result = await markChoreComplete(input);

    expect(result.id).toEqual(assignment.id);
    expect(result.assigned_person).toBeNull();
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent assignment', async () => {
    const input: MarkChoreCompleteInput = {
      assignment_id: 99999 // Non-existent ID
    };

    await expect(markChoreComplete(input)).rejects.toThrow(/assignment with id 99999 not found/i);
  });

  it('should handle assignment that is already completed', async () => {
    // Create a test chore
    const [chore] = await db.insert(choresTable)
      .values({
        name: 'Already Complete Chore',
        description: 'A chore that was already completed'
      })
      .returning()
      .execute();

    // Create a weekly assignment that is already completed
    const originalCompletedAt = new Date('2024-01-10T10:00:00Z');
    const [assignment] = await db.insert(weeklyAssignmentsTable)
      .values({
        chore_id: chore.id,
        week_start: '2024-01-08',
        assigned_person: 'Bob Wilson',
        is_completed: true,
        completed_at: originalCompletedAt
      })
      .returning()
      .execute();

    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    const result = await markChoreComplete(input);

    // Should update the completed_at timestamp even if already completed
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at!.getTime()).toBeGreaterThan(originalCompletedAt.getTime());
    expect(result.assigned_person).toEqual('Bob Wilson');
  });
});
