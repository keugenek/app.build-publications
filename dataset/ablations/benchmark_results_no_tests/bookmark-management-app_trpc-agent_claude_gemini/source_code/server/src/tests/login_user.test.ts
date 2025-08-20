import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { createHash } from 'crypto';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  display_name: 'Test User'
};

const secondTestUser = {
  email: 'user2@example.com',
  password: 'password456',
  display_name: 'Second User'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with correct credentials', async () => {
    // Create test user with hashed password
    const hashedPassword = createHash('sha256').update(testUser.password).digest('hex');
    const createdUsers = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: hashedPassword,
        display_name: testUser.display_name
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];

    const loginInput: LoginUserInput = {
      email: testUser.email,
      password: testUser.password
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual(testUser.email);
    expect(result!.display_name).toEqual(testUser.display_name);
    expect(result!.password_hash).toEqual(hashedPassword);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent email', async () => {
    const loginInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user with hashed password
    const hashedPassword = createHash('sha256').update(testUser.password).digest('hex');
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: hashedPassword,
        display_name: testUser.display_name
      })
      .execute();

    const loginInput: LoginUserInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create user with lowercase email
    const hashedPassword = createHash('sha256').update(testUser.password).digest('hex');
    await db.insert(usersTable)
      .values({
        email: testUser.email.toLowerCase(),
        password_hash: hashedPassword,
        display_name: testUser.display_name
      })
      .execute();

    // Try login with uppercase email
    const loginInput: LoginUserInput = {
      email: testUser.email.toUpperCase(),
      password: testUser.password
    };

    const result = await loginUser(loginInput);

    // Should return null because email doesn't match exactly
    expect(result).toBeNull();
  });

  it('should distinguish between different users', async () => {
    // Create two users
    const hashedPassword1 = createHash('sha256').update(testUser.password).digest('hex');
    const hashedPassword2 = createHash('sha256').update(secondTestUser.password).digest('hex');

    const createdUsers1 = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: hashedPassword1,
        display_name: testUser.display_name
      })
      .returning()
      .execute();

    const createdUsers2 = await db.insert(usersTable)
      .values({
        email: secondTestUser.email,
        password_hash: hashedPassword2,
        display_name: secondTestUser.display_name
      })
      .returning()
      .execute();

    // Login as first user
    const loginInput1: LoginUserInput = {
      email: testUser.email,
      password: testUser.password
    };

    const result1 = await loginUser(loginInput1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(createdUsers1[0].id);
    expect(result1!.email).toEqual(testUser.email);
    expect(result1!.display_name).toEqual(testUser.display_name);

    // Login as second user
    const loginInput2: LoginUserInput = {
      email: secondTestUser.email,
      password: secondTestUser.password
    };

    const result2 = await loginUser(loginInput2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(createdUsers2[0].id);
    expect(result2!.email).toEqual(secondTestUser.email);
    expect(result2!.display_name).toEqual(secondTestUser.display_name);
    expect(result2!.id).not.toEqual(result1!.id);
  });

  it('should handle empty password gracefully', async () => {
    // Create test user with hashed password
    const hashedPassword = createHash('sha256').update(testUser.password).digest('hex');
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: hashedPassword,
        display_name: testUser.display_name
      })
      .execute();

    const loginInput: LoginUserInput = {
      email: testUser.email,
      password: ''
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle password hash comparison correctly', async () => {
    // Create user with a known hash
    const plainPassword = 'test123';
    const hashedPassword = createHash('sha256').update(plainPassword).digest('hex');
    
    await db.insert(usersTable)
      .values({
        email: 'hash@example.com',
        password_hash: hashedPassword,
        display_name: 'Hash Test User'
      })
      .execute();

    // Test with correct password
    const correctLogin: LoginUserInput = {
      email: 'hash@example.com',
      password: plainPassword
    };

    const correctResult = await loginUser(correctLogin);
    expect(correctResult).not.toBeNull();

    // Test with incorrect password
    const incorrectLogin: LoginUserInput = {
      email: 'hash@example.com',
      password: 'wrongpassword'
    };

    const incorrectResult = await loginUser(incorrectLogin);
    expect(incorrectResult).toBeNull();
  });
});
