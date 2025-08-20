import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type AuthResponse } from '../schema';
import { eq, or } from 'drizzle-orm';
import crypto from 'crypto';

export const registerUser = async (input: RegisterUserInput): Promise<AuthResponse> => {
  try {
    // Check if email or username already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(or(
        eq(usersTable.email, input.email),
        eq(usersTable.username, input.username)
      ))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.email === input.email) {
        throw new Error('Email already exists');
      }
      if (existing.username === input.username) {
        throw new Error('Username already exists');
      }
    }

    // Hash the password using built-in crypto
    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = crypto.pbkdf2Sync(input.password, salt, 10000, 64, 'sha256').toString('hex') + ':' + salt;

    // Create the user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        username: input.username,
        password_hash
      })
      .returning()
      .execute();

    const user = result[0];

    // Return user data without password hash
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
