import { type CreateMemberInput, type Member } from '../schema';

// Placeholder handler for creating a member
import { db } from '../db';
import { membersTable } from '../db/schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    const result = await db
      .insert(membersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
      })
      .returning()
      .execute();

    // result is an array with the inserted row
    const member = result[0];
    return member as Member;
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
