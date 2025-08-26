import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First, check if the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // If email is being updated, check for uniqueness
    if (input.email) {
      const emailExists = await db.select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.email, input.email),
            ne(usersTable.id, input.id)
          )
        )
        .execute();

      if (emailExists.length > 0) {
        throw new Error(`Email ${input.email} is already in use`);
      }
    }

    // Build update object with only provided fields
    const updateFields: Partial<{
      name: string;
      email: string;
      role: 'member' | 'admin' | 'instructor';
    }> = {};

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.email !== undefined) {
      updateFields.email = input.email;
    }
    if (input.role !== undefined) {
      updateFields.role = input.role;
    }

    // If no fields to update, return the existing user
    if (Object.keys(updateFields).length === 0) {
      return existingUser[0];
    }

    // Update the user
    const result = await db.update(usersTable)
      .set(updateFields)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
