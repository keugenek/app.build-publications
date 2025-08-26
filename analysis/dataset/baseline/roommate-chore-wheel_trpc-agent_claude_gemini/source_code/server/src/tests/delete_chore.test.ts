import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, participantsTable, weeksTable, assignmentsTable } from '../db/schema';
import { type DeleteChoreInput } from '../schema';
import { deleteChore } from '../handlers/delete_chore';
import { eq } from 'drizzle-orm';

describe('deleteChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing chore', async () => {
    // Create a test chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    const input: DeleteChoreInput = {
      id: choreId
    };

    const result = await deleteChore(input);

    expect(result.success).toBe(true);

    // Verify chore was deleted
    const remainingChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(remainingChores).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent chore', async () => {
    const input: DeleteChoreInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteChore(input);

    expect(result.success).toBe(false);
  });

  it('should delete related assignments when deleting a chore', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable)
      .values({
        name: 'Test Participant'
      })
      .returning()
      .execute();

    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore'
      })
      .returning()
      .execute();

    const weekResult = await db.insert(weeksTable)
      .values({
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      })
      .returning()
      .execute();

    // Create an assignment that references the chore
    const assignmentResult = await db.insert(assignmentsTable)
      .values({
        week_id: weekResult[0].id,
        participant_id: participantResult[0].id,
        chore_id: choreResult[0].id,
        is_completed: false
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;
    const assignmentId = assignmentResult[0].id;

    // Delete the chore
    const input: DeleteChoreInput = {
      id: choreId
    };

    const result = await deleteChore(input);

    expect(result.success).toBe(true);

    // Verify chore was deleted
    const remainingChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(remainingChores).toHaveLength(0);

    // Verify related assignment was also deleted
    const remainingAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignmentId))
      .execute();

    expect(remainingAssignments).toHaveLength(0);
  });

  it('should delete multiple related assignments when deleting a chore', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable)
      .values([
        { name: 'Participant 1' },
        { name: 'Participant 2' }
      ])
      .returning()
      .execute();

    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Shared Chore'
      })
      .returning()
      .execute();

    const weekResult = await db.insert(weeksTable)
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
        }
      ])
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Create multiple assignments for the same chore
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: weekResult[0].id,
          participant_id: participantResult[0].id,
          chore_id: choreId,
          is_completed: false
        },
        {
          week_id: weekResult[1].id,
          participant_id: participantResult[1].id,
          chore_id: choreId,
          is_completed: true
        }
      ])
      .execute();

    // Verify assignments exist before deletion
    const assignmentsBeforeDelete = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.chore_id, choreId))
      .execute();

    expect(assignmentsBeforeDelete).toHaveLength(2);

    // Delete the chore
    const input: DeleteChoreInput = {
      id: choreId
    };

    const result = await deleteChore(input);

    expect(result.success).toBe(true);

    // Verify chore was deleted
    const remainingChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(remainingChores).toHaveLength(0);

    // Verify all related assignments were deleted
    const remainingAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.chore_id, choreId))
      .execute();

    expect(remainingAssignments).toHaveLength(0);
  });

  it('should not affect other chores when deleting a specific chore', async () => {
    // Create multiple chores
    const choreResults = await db.insert(choresTable)
      .values([
        { name: 'Chore to Delete' },
        { name: 'Chore to Keep' }
      ])
      .returning()
      .execute();

    const choreToDeleteId = choreResults[0].id;
    const choreToKeepId = choreResults[1].id;

    // Delete one chore
    const input: DeleteChoreInput = {
      id: choreToDeleteId
    };

    const result = await deleteChore(input);

    expect(result.success).toBe(true);

    // Verify correct chore was deleted
    const deletedChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreToDeleteId))
      .execute();

    expect(deletedChore).toHaveLength(0);

    // Verify other chore still exists
    const keptChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreToKeepId))
      .execute();

    expect(keptChore).toHaveLength(1);
    expect(keptChore[0].name).toBe('Chore to Keep');
  });
});
