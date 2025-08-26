import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        membership_type: input.membership_type,
        status: input.status // Zod default is 'active'
      })
      .returning()
      .execute();

    const member = result[0];
    return member;
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
