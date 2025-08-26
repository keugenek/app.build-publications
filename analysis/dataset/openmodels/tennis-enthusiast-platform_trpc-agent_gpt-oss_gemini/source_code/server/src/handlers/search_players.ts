import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type User, type SearchPlayersInput } from '../schema';

/**
 * Search for users (players) based on optional skill level and location filters.
 *
 * The function builds the query step‑by‑step, adding WHERE conditions only when
 * the corresponding filter is present.  When multiple conditions are provided we
 * combine them with `and(...conditions)` (spread operator) as required by the
 * project's query‑building conventions.
 */
export const searchPlayers = async (
  input: SearchPlayersInput,
): Promise<User[]> => {
  // Start with a base query selecting from the users table.
  let query: any = db.select().from(usersTable);

  // Collect conditional filters.
  let conditions: any[] = [];
  if (input.skill_level !== undefined) {
    // skill_level is an enum stored as text in the DB.
    conditions.push(eq(usersTable.skill_level, input.skill_level));
  }
  if (input.location !== undefined) {
    conditions.push(eq(usersTable.location, input.location));
  }

  // Apply WHERE clause if we have any conditions.
  if (conditions.length > 0) {
    query =
      conditions.length === 1
        ? query.where(conditions[0])
        : query.where(and(...conditions)); // spread operator!
  }

  // Execute the query and return the rows directly.
  const results = await query.execute();
  return results;
};
