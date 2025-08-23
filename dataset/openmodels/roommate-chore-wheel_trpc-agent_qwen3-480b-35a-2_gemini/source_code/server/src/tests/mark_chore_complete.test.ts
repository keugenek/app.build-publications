import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, weeklyChoreAssignmentsTable } from '../db/schema';
import { type CreateUserInput, type CreateChoreInput, type MarkChoreCompleteInput } from '../schema';
import { markChoreComplete } from '../handlers/mark_chore_complete';
import { eq } from 'drizzle-orm';

// Helper functions to create test data
const createUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({ name: input.name })
    .returning()
    .execute();
  return result[0];
};

const createChore = async (input: CreateChoreInput) => {
  const result = await db.insert(choresTable)
    .values({ 
      name: input.name, 
      description: input.description 
    })
    .returning()
    .execute();
  return result[0];
};

const createWeeklyChoreAssignment = async (user_id: number, chore_id: number) => {
  const result = await db.insert(weeklyChoreAssignmentsTable)
    .values({
      user_id,
      chore_id,
      week_start_date: new Date('2023-01-01').toISOString().split('T')[0], // Format as YYYY-MM-DD for date column
      is_completed: false
    })
    .returning()
    .execute();
  return result[0];
};

describe('markChoreComplete', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark a chore as complete', async () => {
    // Create prerequisite data
    const user = await createUser({ name: 'Test User' });
    const chore = await createChore({ name: 'Test Chore', description: 'A test chore' });
    const assignment = await createWeeklyChoreAssignment(user.id, chore.id);

    // Prepare input
    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    // Execute handler
    const result = await markChoreComplete(input);

    // Validate result
    expect(result.id).toBe(assignment.id);
    expect(result.user_id).toBe(user.id);
    expect(result.chore_id).toBe(chore.id);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.week_start_date).toBeInstanceOf(Date);
    expect(result.assigned_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create prerequisite data
    const user = await createUser({ name: 'Test User' });
    const chore = await createChore({ name: 'Test Chore', description: 'A test chore' });
    const assignment = await createWeeklyChoreAssignment(user.id, chore.id);

    // Prepare input
    const input: MarkChoreCompleteInput = {
      assignment_id: assignment.id
    };

    // Execute handler
    await markChoreComplete(input);

    // Query database to verify update
    const assignments = await db.select()
      .from(weeklyChoreAssignmentsTable)
      .where(eq(weeklyChoreAssignmentsTable.id, assignment.id))
      .execute();

    expect(assignments).toHaveLength(1);
    const updatedAssignment = assignments[0];
    expect(updatedAssignment.is_completed).toBe(true);
    expect(updatedAssignment.completed_at).toBeInstanceOf(Date);
    expect(updatedAssignment.completed_at).not.toBeNull();
  });

  it('should throw an error for non-existent assignment', async () => {
    // Prepare input with non-existent ID
    const input: MarkChoreCompleteInput = {
      assignment_id: 99999
    };

    // Execute handler and expect error
    await expect(markChoreComplete(input)).rejects.toThrow(/not found/i);
  });
});
