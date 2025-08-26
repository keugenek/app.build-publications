import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Test user data
const testUserEmail = 'test@example.com';
const testUserPassword = 'password123';
let hashedPassword: string;

const testLoginInput: LoginInput = {
  email: testUserEmail,
  password: testUserPassword
};

// Helper function to hash password (same as in handler)
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

// Helper function to decode our simple JWT-like token
const decodeToken = (token: string): any => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  
  const payload = Buffer.from(parts[1], 'base64url').toString();
  return JSON.parse(payload);
};

describe('loginUser', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user with hashed password
    hashedPassword = hashPassword(testUserPassword);
    await db.insert(usersTable)
      .values({
        email: testUserEmail,
        password_hash: hashedPassword
      })
      .execute();
  });

  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    const result = await loginUser(testLoginInput);

    // Verify user data structure
    expect(result.user).toBeDefined();
    expect(result.user.email).toEqual(testUserEmail);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    
    // Verify token is provided
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    
    // Verify password hash is not included in response
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should return valid token with correct payload', async () => {
    const result = await loginUser(testLoginInput);
    
    // Verify token structure and content
    const decoded = decodeToken(result.token!);
    
    expect(decoded.userId).toBeDefined();
    expect(decoded.email).toEqual(testUserEmail);
    expect(decoded.exp).toBeDefined(); // Expiration time should be set
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000)); // Should be in the future
  });

  it('should fail with non-existent email', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: testUserPassword
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should fail with incorrect password', async () => {
    const invalidInput: LoginInput = {
      email: testUserEmail,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle empty email', async () => {
    const invalidInput: LoginInput = {
      email: '',
      password: testUserPassword
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle empty password', async () => {
    const invalidInput: LoginInput = {
      email: testUserEmail,
      password: ''
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should retrieve correct user data from database', async () => {
    const result = await loginUser(testLoginInput);
    
    // Verify the returned user matches database record
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testUserEmail))
      .execute();
    
    expect(dbUsers).toHaveLength(1);
    const dbUser = dbUsers[0];
    
    expect(result.user.id).toEqual(dbUser.id);
    expect(result.user.email).toEqual(dbUser.email);
    expect(result.user.created_at.getTime()).toEqual(dbUser.created_at.getTime());
    expect(result.user.updated_at.getTime()).toEqual(dbUser.updated_at.getTime());
  });

  it('should handle case-sensitive email matching', async () => {
    const invalidInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM', // Different case
      password: testUserPassword
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });
});
