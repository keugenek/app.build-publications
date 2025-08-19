import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build the update object with only the provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date()
    };

    // Add only the fields that are provided in the input
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
    if (input.date_of_birth !== undefined) {
      updateData.date_of_birth = input.date_of_birth;
    }
    if (input.membership_start_date !== undefined) {
      updateData.membership_start_date = input.membership_start_date;
    }
    if (input.membership_end_date !== undefined) {
      updateData.membership_end_date = input.membership_end_date;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    // Check if user was found and updated
    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
