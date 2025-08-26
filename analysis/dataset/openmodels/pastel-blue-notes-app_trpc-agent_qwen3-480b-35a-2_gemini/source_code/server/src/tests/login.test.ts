import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';
import bcrypt from 'bcryptjs';

// Test login input
const validLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('login', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user with hashed password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(validLoginInput.password, saltRounds);
    
    await db.insert(usersTable).values({
      email: validLoginInput.email,
      password_hash: hashedPassword
    }).execute();
  });
  
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    const result = await login(validLoginInput);

    // Validate the result structure
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('userId');
    expect(typeof result.token).toBe('string');
    expect(typeof result.userId).toBe('number');
    expect(result.token.length).toBeGreaterThan(0);
    expect(result.userId).toBeGreaterThan(0);
    
    // Verify it's a fake token with the user ID
    expect(result.token).toMatch(new RegExp(`fake-token-for-user-${result.userId}`));
  });

  it('should throw error with invalid email', async () => {
    const invalidLoginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(login(invalidLoginInput)).rejects.toThrow(/Invalid email or password/i);
  });

  it('should throw error with invalid password', async () => {
    const invalidLoginInput: LoginInput = {
      email: validLoginInput.email,
      password: 'wrongpassword'
    };

    await expect(login(invalidLoginInput)).rejects.toThrow(/Invalid email or password/i);
  });

  it('should save user to database', async () => {
    // Query the user we created in beforeEach
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, validLoginInput.email))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual(validLoginInput.email);
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].id).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
  });
});
