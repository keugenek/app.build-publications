import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type Member } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
  try {
    // First, check if the member exists
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.id))
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with id ${input.id} not found`);
    }

    // Build update object only with provided fields
    const updateData: Partial<typeof membersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.membership_type !== undefined) {
      updateData.membership_type = input.membership_type;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the member record
    const result = await db.update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Member update failed:', error);
    throw error;
  }
};
