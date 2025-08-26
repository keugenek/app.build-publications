import { type LoginInput, type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Login handler.
 * Looks up a user by email and checks the password (plain‑text comparison for demo).
 * In a real application the password would be hashed and compared with bcrypt.
 */
export const login = async (input: LoginInput): Promise<User> => {
  // Find user with the provided email
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, input.email))
    .execute();

  if (users.length === 0) {
    console.error('Login failed: user not found', { email: input.email });
    throw new Error('Invalid credentials');
  }

  const userRecord = users[0];

  // Simple password check – for demonstration only (plain text)
  if (userRecord.password_hash !== input.password) {
    console.error('Login failed: incorrect password', { email: input.email });
    throw new Error('Invalid credentials');
  }

  // Return user data matching the schema type
  return {
    id: userRecord.id,
    email: userRecord.email,
    created_at: userRecord.created_at,
  } as User;
};
