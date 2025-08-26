import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User, type UserRole } from '../schema';
import { eq } from 'drizzle-orm';

export interface GetUsersFilters {
  role?: UserRole;
}

export async function getUsers(filters?: GetUsersFilters): Promise<User[]> {
  try {
    // Start with base query
    const baseQuery = db.select().from(usersTable);

    // Apply role filter if provided
    const query = filters?.role 
      ? baseQuery.where(eq(usersTable.role, filters.role))
      : baseQuery;

    const results = await query.execute();
    
    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
