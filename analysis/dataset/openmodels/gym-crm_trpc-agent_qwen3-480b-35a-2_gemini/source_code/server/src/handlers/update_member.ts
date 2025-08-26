import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type Member } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
  try {
    // Build the update data object with only provided fields
    const updateData: Partial<Member> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    // Update member record
    const result = await db.update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Member with id ${input.id} not found`);
    }

    const member = result[0];
    return {
      ...member,
      created_at: new Date(member.created_at)
    };
  } catch (error) {
    console.error('Member update failed:', error);
    throw error;
  }
};
