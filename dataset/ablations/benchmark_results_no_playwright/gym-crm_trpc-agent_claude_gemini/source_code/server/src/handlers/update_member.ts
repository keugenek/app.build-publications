import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type Member } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
  try {
    // First check if the member exists
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.id))
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are explicitly provided in the input
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.membership_type !== undefined) updateData.membership_type = input.membership_type;
    if (input.membership_start_date !== undefined) updateData.membership_start_date = input.membership_start_date.toISOString().split('T')[0];
    if (input.membership_end_date !== undefined) updateData.membership_end_date = input.membership_end_date.toISOString().split('T')[0];
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // Update the member record
    const result = await db.update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, input.id))
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const updatedMember = result[0];
    return {
      ...updatedMember,
      membership_start_date: new Date(updatedMember.membership_start_date),
      membership_end_date: new Date(updatedMember.membership_end_date)
    };
  } catch (error) {
    console.error('Member update failed:', error);
    throw error;
  }
};
