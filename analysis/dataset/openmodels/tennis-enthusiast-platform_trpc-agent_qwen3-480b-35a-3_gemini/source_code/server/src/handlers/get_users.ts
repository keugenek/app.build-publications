import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User, type SearchPlayersInput } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getUsers = async (searchCriteria?: SearchPlayersInput): Promise<User[]> => {
  try {
    // Start with base query
    const query = db.select().from(usersTable);
    
    const conditions: SQL<unknown>[] = [];

    if (searchCriteria?.skill_level) {
      conditions.push(eq(usersTable.skill_level, searchCriteria.skill_level));
    }

    if (searchCriteria?.location) {
      conditions.push(eq(usersTable.location, searchCriteria.location));
    }

    // Apply filters if any conditions exist
    if (conditions.length > 0) {
      const finalQuery = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
      const results = await finalQuery.execute();
      
      // Convert timestamp strings to Date objects
      return results.map(user => ({
        ...user,
        created_at: new Date(user.created_at)
      }));
    }

    // No filters, return all users
    const results = await query.execute();
    
    // Convert timestamp strings to Date objects
    return results.map(user => ({
      ...user,
      created_at: new Date(user.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
