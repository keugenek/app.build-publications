import { db } from '../db';
import { membersTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ClassIdInput, type Member } from '../schema';

/**
 * Fetch all members that have a reservation for the given class.
 * The query joins the `members` and `reservations` tables and filters by
 * `reservations.class_id`.
 *
 * Returns an array of Member objects (as defined in the Zod schema).
 */
export const getMembersByClass = async (input: ClassIdInput): Promise<Member[]> => {
  try {
    const rows = await db
      .select()
      .from(membersTable)
      .innerJoin(
        reservationsTable,
        eq(membersTable.id, reservationsTable.member_id)
      )
      .where(eq(reservationsTable.class_id, input.class_id))
      .execute();

    // After a join, each row has the shape { members: MemberRow; reservations: ReservationRow }
    // We only need the member part.
    const members = rows.map((row) => row.members);
    return members;
  } catch (error) {
    console.error('Failed to get members by class:', error);
    throw error;
  }
};
