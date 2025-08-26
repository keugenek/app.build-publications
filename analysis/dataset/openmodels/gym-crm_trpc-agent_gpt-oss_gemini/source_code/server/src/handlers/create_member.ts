import { type CreateMemberInput, type Member } from '../schema';
import { db } from '../db';
import { membersTable } from '../db/schema';

/**
 * Handler for creating a new gym member.
 */
export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    const result = await db
      .insert(membersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone ?? null,
      })
      .returning()
      .execute();

    const member = result[0];
    // Drizzle returns Date objects for timestamp columns, so we can return directly
    return {
      ...member,
    } as Member;
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
