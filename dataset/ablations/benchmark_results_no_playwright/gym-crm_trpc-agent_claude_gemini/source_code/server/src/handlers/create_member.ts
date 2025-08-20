import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        membership_type: input.membership_type,
        membership_start_date: input.membership_start_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        membership_end_date: input.membership_end_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
        // is_active defaults to true via database schema
        // created_at and updated_at are set automatically via database schema
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const member = result[0];
    return {
      ...member,
      membership_start_date: new Date(member.membership_start_date),
      membership_end_date: new Date(member.membership_end_date)
    };
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};
