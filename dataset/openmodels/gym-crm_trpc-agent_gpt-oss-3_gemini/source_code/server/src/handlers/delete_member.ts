import { type Member } from '../schema';
import { db } from '../db';
import { membersTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Deletes a member by ID and returns the deleted member data.
 * Also deletes any reservations associated with the member to satisfy
 * foreign‑key constraints.
 */
export const deleteMember = async (id: number): Promise<Member> => {
  try {
    // Fetch the member first so we can return its data after deletion
    const members = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, id))
      .execute();

    if (members.length === 0) {
      throw new Error(`Member with id ${id} not found`);
    }
    const member = members[0];

    // Remove dependent reservations to avoid FK violations
    await db
      .delete(reservationsTable)
      .where(eq(reservationsTable.member_id, id))
      .execute();

    // Delete the member record itself
    await db
      .delete(membersTable)
      .where(eq(membersTable.id, id))
      .execute();

    // Return the deleted member in the shape expected by the Zod schema
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      created_at: member.created_at,
    } as Member;
  } catch (error) {
    console.error('Failed to delete member:', error);
    throw error;
  }
};
