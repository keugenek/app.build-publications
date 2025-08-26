import { type SearchUsersInput, type User } from '../schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { usersTable } from '../db/schema';

/**
 * Search users by optional location and skill_level.
 * Returns all users when no filters are provided.
 */
export const searchUsers = async (input: SearchUsersInput): Promise<User[]> => {
  // Build base query
  let query: any = db.select().from(usersTable);

  // Collect filter conditions
  const conditions: any[] = [];
  if (input.location !== undefined) {
    conditions.push(eq(usersTable.location, input.location));
  }
  if (input.skill_level !== undefined) {
    conditions.push(eq(usersTable.skill_level, input.skill_level));
  }

  // Apply where clause if any filters are present
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  const results = await query.execute();
  return results;
};
