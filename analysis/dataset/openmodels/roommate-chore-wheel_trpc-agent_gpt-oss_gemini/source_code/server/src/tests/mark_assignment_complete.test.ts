import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, assignmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { markAssignmentComplete } from '../handlers/mark_assignment_complete';

describe('markAssignmentComplete handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update assignment completed status', async () => {
    // Insert a user
    const [user] = await db
      .insert(usersTable)
      .values({ name: 'Test User' })
      .returning()
      .execute();

    // Insert a chore
    const [chore] = await db
      .insert(choresTable)
      .values({ title: 'Test Chore', description: 'Do something' })
      .returning()
      .execute();

    // Insert an assignment (completed false)
    const weekStart = new Date('2024-01-01');
    const [assignment] = await db
      .insert(assignmentsTable)
      .values({
        chore_id: chore.id,
        user_id: user.id,
        week_start: weekStart.toISOString().split('T')[0],
        completed: false,
      })
      .returning()
      .execute();

    // Mark assignment as completed via handler
    const updated = await markAssignmentComplete({ id: assignment.id, completed: true });

    // Verify returned object
    expect(updated.id).toBe(assignment.id);
    expect(updated.completed).toBe(true);

    // Verify DB state
    const fetched = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignment.id))
      .execute();

    expect(fetched).toHaveLength(1);
    expect(fetched[0].completed).toBe(true);
  });
});
