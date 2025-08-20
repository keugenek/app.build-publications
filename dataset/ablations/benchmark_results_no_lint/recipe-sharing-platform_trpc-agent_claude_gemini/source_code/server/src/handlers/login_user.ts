import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User | null> {
  try {
    // Find user by email in the database
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (results.length === 0) {
      // No user found with this email
      return null;
    }

    const user = results[0];

    // For this implementation, we'll use a simple hash comparison
    // In a real application, you would use bcrypt or similar
    const hashedInputPassword = await hashPassword(input.password);
    
    if (user.password_hash !== hashedInputPassword) {
      // Invalid password
      return null;
    }

    // Return user if credentials are valid
    return user;
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
}

// Simple password hashing function using built-in crypto
// In production, use bcrypt or similar with salt
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
