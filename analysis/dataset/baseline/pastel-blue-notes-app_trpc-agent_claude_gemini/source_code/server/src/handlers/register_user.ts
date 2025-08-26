import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput, type AuthResponse } from '../schema';

// Simple password hashing function (for demo purposes - use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Simple JWT-like token generation (for demo purposes - use proper JWT library in production)
const generateToken = (userId: number, email: string): string => {
  const payload = {
    userId,
    email,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload));
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  try {
    // 1. Check if email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('Email already exists');
    }

    // 2. Hash the password
    const password_hash = await hashPassword(input.password);

    // 3. Insert new user into database
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: password_hash
      })
      .returning()
      .execute();

    const newUser = result[0];

    // 4. Generate token for authentication
    const token = generateToken(newUser.id, newUser.email);

    // 5. Return user data (without password) and token
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token: token
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
