import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq, or, and, ne } from 'drizzle-orm';


export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First, verify the user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Check for uniqueness conflicts (username/email) if they are being updated
    if (input.username || input.email) {
      const conflicts = await db.select()
        .from(usersTable)
        .where(
          and(
            ne(usersTable.id, input.id), // Exclude current user
            or(
              input.username ? eq(usersTable.username, input.username) : undefined,
              input.email ? eq(usersTable.email, input.email) : undefined
            )
          )
        )
        .execute();

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        if (input.username && conflict.username === input.username) {
          throw new Error('Username already exists');
        }
        if (input.email && conflict.email === input.email) {
          throw new Error('Email already exists');
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.username) {
      updateData.username = input.username;
    }

    if (input.email) {
      updateData.email = input.email;
    }

    if (input.password) {
      updateData.password_hash = await Bun.password.hash(input.password);
    }

    // Update the user
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
