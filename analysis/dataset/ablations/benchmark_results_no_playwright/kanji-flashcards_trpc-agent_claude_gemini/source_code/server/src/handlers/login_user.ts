import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Simple hash function for password verification (in production, use bcrypt)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Simple JWT-like token generation (in production, use proper JWT library)
function generateToken(userId: number, email: string): string {
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Simple base64 encoding (in production, use proper JWT signing)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function loginUser(input: LoginUserInput): Promise<AuthResponse> {
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

    // Verify password (simple hash comparison - in production, use bcrypt.compare)
    const hashedInputPassword = hashPassword(input.password);
    if (hashedInputPassword !== user.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Return user data without password hash and include token
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
