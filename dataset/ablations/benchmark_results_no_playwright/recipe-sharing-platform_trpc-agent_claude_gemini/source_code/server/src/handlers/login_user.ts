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

    // In a real implementation, you would use a proper password hashing library like bcrypt
    // For this example, we'll do a simple comparison (NOT secure for production!)
    // Production code should use: await bcrypt.compare(input.password, user.password_hash)
    if (input.password !== user.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Return user data (password hash should be excluded in production)
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
