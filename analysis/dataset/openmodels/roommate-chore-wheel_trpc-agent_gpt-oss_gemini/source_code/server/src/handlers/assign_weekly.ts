import { db } from '../db';
import { usersTable, choresTable, assignmentsTable } from '../db/schema';
import { type AssignWeeklyInput, type Assignment } from '../schema';

/**
 * Assign all chores to users for a given week.
 * Simple round-robin assignment: iterate chores and assign to users cyclically.
 * Inserts assignments into the database and returns the created records.
 */
export const assignWeekly = async (input: AssignWeeklyInput): Promise<Assignment[]> => {
  try {
    // Load all users and chores
    const users = await db.select().from(usersTable).execute();
    const chores = await db.select().from(choresTable).execute();

    // If either list is empty, nothing to assign
    if (users.length === 0 || chores.length === 0) {
      return [];
    }

    const assignments: Assignment[] = [];

    // Assign each chore to a user (round-robin)
    for (let i = 0; i < chores.length; i++) {
      const chore = chores[i];
      const user = users[i % users.length];

      // Insert assignment and retrieve the full row
      const [inserted] = await db
        .insert(assignmentsTable)
        .values({
          chore_id: chore.id,
          user_id: user.id,
          week_start: input.week_start.toISOString().split('T')[0],
          // completed defaults to false via schema
        })
        .returning()
        .execute();

      const assignment: Assignment = {
        ...inserted,
        week_start: new Date(inserted.week_start as unknown as string), // convert string to Date
      };
      assignments.push(assignment);
    }

    return assignments;
  } catch (error) {
    console.error('Assign weekly failed:', error);
    throw error;
  }
};
