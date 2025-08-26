import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { eq } from 'drizzle-orm';

export async function getMemberById(memberId: number): Promise<Member | null> {
  try {
    const results = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, memberId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to fetch member by ID:', error);
    throw error;
  }
}
