import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginUserInput): Promise<User | null> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Verify password using Bun's built-in password hashing
    const passwordMatches = await Bun.password.verify(input.password, user.password_hash);

    if (!passwordMatches) {
      return null; // Invalid password
    }

    // Return user object if authentication succeeds
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
