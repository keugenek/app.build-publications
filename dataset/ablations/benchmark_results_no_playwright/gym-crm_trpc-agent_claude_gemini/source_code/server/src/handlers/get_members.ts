import { db } from '../db';
import { membersTable } from '../db/schema';
import { type GetMembersInput, type Member } from '../schema';
import { eq, and, or, ilike, type SQL } from 'drizzle-orm';

export const getMembers = async (input?: GetMembersInput): Promise<Member[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.is_active !== undefined) {
      conditions.push(eq(membersTable.is_active, input.is_active));
    }

    if (input?.membership_type) {
      conditions.push(eq(membersTable.membership_type, input.membership_type));
    }

    // Handle text search across name and email fields
    if (input?.search) {
      const searchPattern = `%${input.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(membersTable.first_name, searchPattern),
          ilike(membersTable.last_name, searchPattern),
          ilike(membersTable.email, searchPattern)
        )!
      );
    }

    // Build and execute query
    const baseQuery = db.select().from(membersTable);
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await finalQuery.execute();

    // Convert date strings to Date objects for schema compliance
    return results.map(member => ({
      ...member,
      membership_start_date: new Date(member.membership_start_date),
      membership_end_date: new Date(member.membership_end_date)
    }));
  } catch (error) {
    console.error('Failed to get members:', error);
    throw error;
  }
};
