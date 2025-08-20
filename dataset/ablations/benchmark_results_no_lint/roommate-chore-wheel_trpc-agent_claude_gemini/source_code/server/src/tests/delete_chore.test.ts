import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { deleteChore } from '../handlers/delete_chore';
import { eq } from 'drizzle-orm';

describe('deleteChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a chore successfully', async () => {
    // Create a test chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        description: 'A chore for testing deletion'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Verify chore exists before deletion
    const choresBefore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(choresBefore).toHaveLength(1);

    // Delete the chore
    await deleteChore(choreId);

    // Verify chore no longer exists
    const choresAfter = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(choresAfter).toHaveLength(0);
  });

  it('should delete chore and associated weekly assignments', async () => {
    // Create a test chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore with Assignments',
        description: 'A chore with weekly assignments'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Create weekly assignments for the chore
    const assignmentResults = await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: choreId,
          week_start: '2024-01-01',
          assigned_person: 'Alice',
          is_completed: false
        },
        {
          chore_id: choreId,
          week_start: '2024-01-08',
          assigned_person: 'Bob',
          is_completed: true
        }
      ])
      .returning()
      .execute();

    // Verify assignments exist before deletion
    const assignmentsBefore = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.chore_id, choreId))
      .execute();

    expect(assignmentsBefore).toHaveLength(2);

    // Delete the chore
    await deleteChore(choreId);

    // Verify chore is deleted
    const choresAfter = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(choresAfter).toHaveLength(0);

    // Verify all associated assignments are also deleted
    const assignmentsAfter = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.chore_id, choreId))
      .execute();

    expect(assignmentsAfter).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent chore', async () => {
    const nonExistentChoreId = 999;

    await expect(deleteChore(nonExistentChoreId))
      .rejects
      .toThrow(/chore with id 999 not found/i);
  });

  it('should not affect other chores when deleting one chore', async () => {
    // Create multiple chores
    const choreResults = await db.insert(choresTable)
      .values([
        {
          name: 'Chore to Delete',
          description: 'This chore will be deleted'
        },
        {
          name: 'Chore to Keep',
          description: 'This chore should remain'
        }
      ])
      .returning()
      .execute();

    const choreToDeleteId = choreResults[0].id;
    const choreToKeepId = choreResults[1].id;

    // Create assignments for both chores
    await db.insert(weeklyAssignmentsTable)
      .values([
        {
          chore_id: choreToDeleteId,
          week_start: '2024-01-01',
          assigned_person: 'Alice'
        },
        {
          chore_id: choreToKeepId,
          week_start: '2024-01-01',
          assigned_person: 'Bob'
        }
      ])
      .execute();

    // Delete one chore
    await deleteChore(choreToDeleteId);

    // Verify the other chore still exists
    const remainingChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreToKeepId))
      .execute();

    expect(remainingChores).toHaveLength(1);
    expect(remainingChores[0].name).toEqual('Chore to Keep');

    // Verify the other chore's assignments still exist
    const remainingAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.chore_id, choreToKeepId))
      .execute();

    expect(remainingAssignments).toHaveLength(1);
    expect(remainingAssignments[0].assigned_person).toEqual('Bob');

    // Verify deleted chore's assignments are gone
    const deletedAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.chore_id, choreToDeleteId))
      .execute();

    expect(deletedAssignments).toHaveLength(0);
  });

  it('should handle deletion of chore with no assignments', async () => {
    // Create a chore with no assignments
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Lonely Chore',
        description: 'A chore with no assignments'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Delete the chore
    await deleteChore(choreId);

    // Verify chore is deleted
    const choresAfter = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .execute();

    expect(choresAfter).toHaveLength(0);
  });
});
