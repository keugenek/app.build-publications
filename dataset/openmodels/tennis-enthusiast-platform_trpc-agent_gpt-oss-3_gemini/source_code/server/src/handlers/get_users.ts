import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { User as DBUser } from '../db/schema';
import type { BrowseUsersInput } from '../schema';
import type { SQL } from 'drizzle-orm';

/**
 * Fetch user profiles with optional filters.
 * Supports filtering by skill_level, city, and state.
 */
export const getUsers = async (input: BrowseUsersInput): Promise<DBUser[]> => {
  try {
    // Base query – typed as any to avoid drizzle generic type complexities
    let query: any = db.select().from(users);

    // Collect conditions based on provided filters
    const conditions: SQL<unknown>[] = [];

    if (input.skill_level !== undefined) {
      conditions.push(eq(users.skill_level, input.skill_level));
    }
    if (input.city !== undefined) {
      conditions.push(eq(users.city, input.city));
    }
    if (input.state !== undefined) {
      conditions.push(eq(users.state, input.state));
    }

    // Apply where clause if any conditions exist
    if (conditions.length > 0) {
      query =
        conditions.length === 1
          ? query.where(conditions[0])
          : query.where(and(...conditions)); // Spread operator as required
    }

    const results: DBUser[] = await query.execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
