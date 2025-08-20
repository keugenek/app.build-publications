import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testPassword = 'securepassword123';
  let testUserEmail: string;
  let hashedPassword: string;

  beforeEach(async () => {
    // Create a test user with hashed password
    testUserEmail = 'test@example.com';
    hashedPassword = await Bun.password.hash(testPassword);
    
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: testUserEmail,
        password_hash: hashedPassword
      })
      .execute();
  });

  it('should return user when credentials are valid', async () => {
    const input: LoginUserInput = {
      email: testUserEmail,
      password: testPassword
    };

    const result = await loginUser(input);

    expect(result).toBeDefined();
    expect(result!.email).toEqual(testUserEmail);
    expect(result!.username).toEqual('testuser');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.password_hash).toEqual(hashedPassword);
  });

  it('should return null when email does not exist', async () => {
    const input: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: testPassword
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });

  it('should return null when password is incorrect', async () => {
    const input: LoginUserInput = {
      email: testUserEmail,
      password: 'wrongpassword'
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });

  it('should handle email case sensitivity correctly', async () => {
    const input: LoginUserInput = {
      email: testUserEmail.toUpperCase(), // Different case
      password: testPassword
    };

    const result = await loginUser(input);

    // Should return null since emails are case-sensitive in our implementation
    expect(result).toBeNull();
  });

  it('should verify password hashing works correctly', async () => {
    // Create another user with different password
    const anotherPassword = 'differentpassword456';
    const anotherHashedPassword = await Bun.password.hash(anotherPassword);
    const anotherEmail = 'another@example.com';

    await db.insert(usersTable)
      .values({
        username: 'anotheruser',
        email: anotherEmail,
        password_hash: anotherHashedPassword
      })
      .execute();

    // Test first user with correct password
    const input1: LoginUserInput = {
      email: testUserEmail,
      password: testPassword
    };

    const result1 = await loginUser(input1);
    expect(result1).toBeDefined();
    expect(result1!.email).toEqual(testUserEmail);

    // Test second user with correct password
    const input2: LoginUserInput = {
      email: anotherEmail,
      password: anotherPassword
    };

    const result2 = await loginUser(input2);
    expect(result2).toBeDefined();
    expect(result2!.email).toEqual(anotherEmail);

    // Test first user with second user's password (should fail)
    const input3: LoginUserInput = {
      email: testUserEmail,
      password: anotherPassword
    };

    const result3 = await loginUser(input3);
    expect(result3).toBeNull();
  });

  it('should handle empty password gracefully', async () => {
    const input: LoginUserInput = {
      email: testUserEmail,
      password: ''
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });
});
