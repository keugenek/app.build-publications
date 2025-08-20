import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, assignmentsTable } from '../db/schema';
// import { type Assignment } from '../schema';
import { getAssignments } from '../handlers/get_assignments';

/** Helper to insert a user */
const insertUser = async (name: string) => {
  const result = await db
    .insert(usersTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

/** Helper to insert a chore */
const insertChore = async (title: string, description: string | null = null) => {
  const result = await db
    .insert(choresTable)
    .values({ title, description })
    .returning()
    .execute();
  return result[0];
};

/** Helper to insert an assignment */
const insertAssignment = async (
  chore_id: number,
  user_id: number,
  week_start: Date,
  completed: boolean = false,
) => {
  const result = await db
    .insert(assignmentsTable)
    .values({
      chore_id,
      user_id,
      week_start: week_start.toISOString().split('T')[0], // store as YYYY-MM-DD string
      completed,
    })
    .returning()
    .execute();
  return result[0];
};

describe('getAssignments handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return assignments for the specified week', async () => {
    const user = await insertUser('Alice');
    const chore = await insertChore('Take out trash');
    const weekStart = new Date('2023-01-02'); // Monday

    await insertAssignment(chore.id, user.id, weekStart, false);

    const assignments = await getAssignments(weekStart);

    expect(assignments).toHaveLength(1);
    const assignment = assignments[0];
    expect(assignment.id).toBeDefined();
    expect(assignment.user_id).toEqual(user.id);
    expect(assignment.chore_id).toEqual(chore.id);
    expect(assignment.week_start).toBeInstanceOf(Date);
    expect(assignment.week_start.getTime()).toEqual(weekStart.getTime());
    expect(assignment.completed).toBe(false);
    expect(assignment.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no assignments exist for the week', async () => {
    const weekStart = new Date('2023-01-02');
    const assignments = await getAssignments(weekStart);
    expect(assignments).toHaveLength(0);
  });
});
