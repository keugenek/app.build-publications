import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { createHash } from 'crypto';

// Simple JWT-like token creation (for demo purposes - in production use proper JWT library)
const createToken = (payload: { userId: number; email: string }): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify({ 
    ...payload, 
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })).toString('base64url');
  
  const secret = process.env['JWT_SECRET'] || 'default-secret-key';
  const signature = createHash('sha256')
    .update(`${header}.${payloadStr}.${secret}`)
    .digest('base64url');
    
  return `${header}.${payloadStr}.${signature}`;
};

// Simple password verification using crypto
const verifyPassword = (password: string, hash: string): boolean => {
  const computedHash = createHash('sha256').update(password).digest('hex');
  return computedHash === hash;
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // 1. Find user by email in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // 2. Verify password hash matches input password
    const isPasswordValid = verifyPassword(input.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Generate JWT-like token for authentication
    const token = createToken({
      userId: user.id,
      email: user.email
    });

    // 4. Return user data (without password) and token
    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token: token
    };

  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
