import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

/**
 * Creates a new member in the database.
 *
 * @param input - Parsed input conforming to {@link CreateMemberInput}
 * @returns The created {@link Member} record with generated id and timestamps.
 */
export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert the new member and return the newly created row
    const result = await db
      .insert(membersTable)
      .values({
        name: input.name,
        email: input.email,
      })
      .returning()
      .execute();

    const member = result[0];
    // The returned record already contains the correct types (Date for timestamps)
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      created_at: member.created_at,
    } as Member;
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
