import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export interface GetMembersFilters {
  status?: 'active' | 'inactive' | 'suspended';
  membership_type?: 'basic' | 'premium' | 'vip';
}

export const getMembers = async (filters?: GetMembersFilters): Promise<Member[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.status) {
      conditions.push(eq(membersTable.status, filters.status));
    }

    if (filters?.membership_type) {
      conditions.push(eq(membersTable.membership_type, filters.membership_type));
    }

    // Build query with optional where clause
    const query = conditions.length > 0
      ? db.select().from(membersTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(membersTable);

    const results = await query.execute();

    return results.map(member => ({
      ...member,
      // Ensure proper date handling
      joined_at: member.joined_at,
      created_at: member.created_at,
      updated_at: member.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};
