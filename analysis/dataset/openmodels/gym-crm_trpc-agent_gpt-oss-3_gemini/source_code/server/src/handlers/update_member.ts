import { type UpdateMemberInput, type Member } from '../schema';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Real implementation for updating a member in the database
export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
  try {
    // Build update fields object based on provided optional inputs
    const updateFields: Partial<{
      name: string;
      email: string;
    }> = {};

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.email !== undefined) {
      updateFields.email = input.email;
    }

    // If no fields to update, simply fetch and return existing member
    if (Object.keys(updateFields).length === 0) {
      const existing = await db
        .select()
        .from(membersTable)
        .where(eq(membersTable.id, input.id))
        .execute();
      const member = existing[0];
      if (!member) {
        throw new Error('Member not found');
      }
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        created_at: member.created_at,
      } as Member;
    }

    const result = await db
      .update(membersTable)
      .set(updateFields)
      .where(eq(membersTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error('Member not found');
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      created_at: updated.created_at,
    } as Member;
  } catch (error) {
    console.error('Member update failed:', error);
    throw error;
  }
};


