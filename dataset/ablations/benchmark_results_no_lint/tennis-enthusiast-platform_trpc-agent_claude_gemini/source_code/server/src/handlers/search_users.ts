import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SearchUsersInput, type User } from '../schema';
import { eq, and, ne } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function searchUsers(input: SearchUsersInput): Promise<User[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by location if provided
    if (input.location) {
      conditions.push(eq(usersTable.location, input.location));
    }

    // Filter by skill level if provided
    if (input.skill_level) {
      conditions.push(eq(usersTable.skill_level, input.skill_level));
    }

    // Exclude the requesting user if provided
    if (input.exclude_user_id) {
      conditions.push(ne(usersTable.id, input.exclude_user_id));
    }

    // Build and execute query based on whether we have conditions
    let results;
    
    if (conditions.length === 0) {
      // No conditions - select all users
      results = await db.select()
        .from(usersTable)
        .orderBy(usersTable.created_at)
        .execute();
    } else if (conditions.length === 1) {
      // Single condition
      results = await db.select()
        .from(usersTable)
        .where(conditions[0])
        .orderBy(usersTable.created_at)
        .execute();
    } else {
      // Multiple conditions
      results = await db.select()
        .from(usersTable)
        .where(and(...conditions))
        .orderBy(usersTable.created_at)
        .execute();
    }

    return results;
  } catch (error) {
    console.error('User search failed:', error);
    throw error;
  }
}
