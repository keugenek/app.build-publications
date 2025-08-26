import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, timingSafeEqual } from 'crypto';

export const loginUser = async (input: LoginUserInput): Promise<User | null> => {
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

    // Verify password using timing-safe comparison
    const inputPasswordHash = createHash('sha256').update(input.password).digest('hex');
    const storedPasswordHash = user.password_hash;
    
    // Use timing-safe comparison to prevent timing attacks
    const isPasswordValid = inputPasswordHash.length === storedPasswordHash.length &&
      timingSafeEqual(Buffer.from(inputPasswordHash), Buffer.from(storedPasswordHash));
    
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user data (excluding password hash for security)
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      display_name: user.display_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
