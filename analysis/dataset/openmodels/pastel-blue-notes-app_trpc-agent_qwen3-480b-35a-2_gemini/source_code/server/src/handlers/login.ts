import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginInput } from '../schema';
import bcrypt from 'bcryptjs';

export const login = async (input: LoginInput): Promise<{ token: string; userId: number }> => {
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // For now, return a simple token and the user ID
    // In a real implementation, this would be a JWT token
    return {
      token: `fake-token-for-user-${user.id}`,
      userId: user.id
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
