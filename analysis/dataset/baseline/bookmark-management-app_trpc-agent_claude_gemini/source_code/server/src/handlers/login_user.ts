import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, timingSafeEqual } from 'crypto';

// Simple hash function for password verification
// In production, use bcrypt or argon2, but using crypto for this implementation
function hashPassword(password: string, salt: string = 'defaultsalt'): string {
  return createHash('sha256').update(password + salt).digest('hex');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  const hash = hashPassword(password);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(hashedPassword));
  } catch {
    return false;
  }
}

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = verifyPassword(input.password, user.password_hash);
    
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
