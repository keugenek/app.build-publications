import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        name: input.name,
        email: input.email
      })
      .returning()
      .execute();

    const member = result[0];
    return {
      ...member
    };
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
