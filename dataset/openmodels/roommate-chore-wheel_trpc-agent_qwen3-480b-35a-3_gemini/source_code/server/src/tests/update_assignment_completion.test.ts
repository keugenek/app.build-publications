import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, usersTable, weeklyAssignmentsTable } from '../db/schema';
import { type UpdateAssignmentCompletionInput } from '../schema';
import { updateAssignmentCompletion } from '../handlers/update_assignment_completion';
import { eq } from 'drizzle-orm';

describe('updateAssignmentCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update assignment completion status to completed', async () => {
    // First, create a chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        description: 'A chore for testing'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Then, create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an assignment
    const assignmentResult = await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: '2023-01-01',
        chore_id: choreId,
        user_id: userId,
        is_completed: false
      })
      .returning()
      .execute();

    const assignmentId = assignmentResult[0].id;

    // Update the assignment completion
    const input: UpdateAssignmentCompletionInput = {
      assignment_id: assignmentId,
      is_completed: true
    };

    const result = await updateAssignmentCompletion(input);

    // Verify the result
    expect(result.id).toEqual(assignmentId);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toBeNull();
    expect(result.week_start_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, assignmentId))
      .execute();

    expect(dbAssignments).toHaveLength(1);
    expect(dbAssignments[0].is_completed).toBe(true);
    expect(dbAssignments[0].completed_at).toBeInstanceOf(Date);
    expect(dbAssignments[0].completed_at).not.toBeNull();
  });

  it('should update assignment completion status to not completed', async () => {
    // First, create a chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        description: 'A chore for testing'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Then, create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an assignment that's already completed
    const assignmentResult = await db.insert(weeklyAssignmentsTable)
      .values({
        week_start_date: '2023-01-01',
        chore_id: choreId,
        user_id: userId,
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const assignmentId = assignmentResult[0].id;

    // Update the assignment completion to not completed
    const input: UpdateAssignmentCompletionInput = {
      assignment_id: assignmentId,
      is_completed: false
    };

    const result = await updateAssignmentCompletion(input);

    // Verify the result
    expect(result.id).toEqual(assignmentId);
    expect(result.is_completed).toBe(false);
    expect(result.completed_at).toBeNull();
    expect(result.week_start_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, assignmentId))
      .execute();

    expect(dbAssignments).toHaveLength(1);
    expect(dbAssignments[0].is_completed).toBe(false);
    expect(dbAssignments[0].completed_at).toBeNull();
  });

  it('should throw an error when assignment ID does not exist', async () => {
    const input: UpdateAssignmentCompletionInput = {
      assignment_id: 99999,
      is_completed: true
    };

    await expect(updateAssignmentCompletion(input))
      .rejects
      .toThrow(/Assignment with ID 99999 not found/);
  });
});
