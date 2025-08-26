import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';

// Simple hash function for testing (matches the one in the handler)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Test user data
const testUserData = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'testpassword123'
};

const testLoginInput: LoginUserInput = {
  email: testUserData.email,
  password: testUserData.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login with valid credentials', async () => {
    // Create test user with hashed password
    const passwordHash = hashPassword(testUserData.password);
    const insertedUsers = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify user data
    expect(result.user.id).toEqual(insertedUsers[0].id);
    expect(result.user.email).toEqual(testUserData.email);
    expect(result.user.username).toEqual(testUserData.username);
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token is generated
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');

    // Verify token contains correct payload
    const decoded = JSON.parse(Buffer.from(result.token!, 'base64').toString());
    expect(decoded.userId).toEqual(insertedUsers[0].id);
    expect(decoded.email).toEqual(testUserData.email);
    expect(decoded.exp).toBeDefined();
  });

  it('should not include password hash in response', async () => {
    // Create test user
    const passwordHash = hashPassword(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify password_hash is not included in response
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for invalid password', async () => {
    // Create test user
    const passwordHash = hashPassword(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .execute();

    const invalidInput: LoginUserInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should verify password correctly with hash', async () => {
    const differentPassword = 'differentpassword123';
    const passwordHash = hashPassword(differentPassword);
    
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .execute();

    // Should work with correct password
    const validInput: LoginUserInput = {
      email: testUserData.email,
      password: differentPassword
    };

    const result = await loginUser(validInput);
    expect(result.user.email).toEqual(testUserData.email);

    // Should fail with incorrect password
    const invalidInput: LoginUserInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should generate valid token with expiration', async () => {
    // Create test user
    const passwordHash = hashPassword(testUserData.password);
    const insertedUsers = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify token structure
    expect(result.token).toBeDefined();
    
    const decoded = JSON.parse(Buffer.from(result.token!, 'base64').toString());
    expect(decoded.userId).toEqual(insertedUsers[0].id);
    expect(decoded.email).toEqual(testUserData.email);
    
    // Verify expiration is set (should be ~24 hours from now)
    const now = Math.floor(Date.now() / 1000);
    const expectedExp = now + (24 * 60 * 60); // 24 hours
    expect(decoded.exp).toBeGreaterThan(now);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 60); // Allow 1 minute tolerance
  });

  it('should handle case-sensitive email matching', async () => {
    // Create user with lowercase email
    const passwordHash = hashPassword(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: testUserData.username,
        password_hash: passwordHash
      })
      .execute();

    // Try login with uppercase email
    const uppercaseEmailInput: LoginUserInput = {
      email: 'TEST@EXAMPLE.COM',
      password: testUserData.password
    };

    // Should fail because email matching is case-sensitive in database
    await expect(loginUser(uppercaseEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should query database correctly', async () => {
    // Create test user
    const passwordHash = hashPassword(testUserData.password);
    const insertedUsers = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    await loginUser(testLoginInput);

    // Verify user still exists in database after login
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testUserData.email))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].id).toEqual(insertedUsers[0].id);
    expect(users[0].email).toEqual(testUserData.email);
  });

  it('should preserve user data integrity', async () => {
    const testDate = new Date('2024-01-01T00:00:00Z');
    const passwordHash = hashPassword(testUserData.password);
    
    const insertedUsers = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        username: testUserData.username,
        password_hash: passwordHash,
        created_at: testDate,
        updated_at: testDate
      })
      .returning()
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify all user fields are correctly returned
    expect(result.user.id).toEqual(insertedUsers[0].id);
    expect(result.user.email).toEqual(testUserData.email);
    expect(result.user.username).toEqual(testUserData.username);
    expect(result.user.created_at).toEqual(testDate);
    expect(result.user.updated_at).toEqual(testDate);
  });
});
