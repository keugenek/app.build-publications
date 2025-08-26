import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginUserInput): Promise<User> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // In a real application, you would use bcrypt to verify the password hash
    // For this implementation, we'll do a simple comparison
    // Note: This is NOT secure for production use
    if (user.password_hash !== input.password) {
      throw new Error('Invalid email or password');
    }

    return user;
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
