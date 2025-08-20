import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    // Return the created member
    return result[0];
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
