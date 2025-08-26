import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginInput, type RegisterInput } from '../schema';
import { registerUser, authenticateUser } from '../handlers/user_auth';

// Test inputs
const validRegisterInput: RegisterInput = {
  username: 'testuser',
  password: 'password123'
};

const validLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

const invalidLoginInput: LoginInput = {
  username: 'testuser',
  password: 'wrongpassword'
};

describe('user_auth', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const result = await registerUser(validRegisterInput);

      // Basic field validation
      expect(result.username).toEqual('testuser');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.password_hash).toBeDefined();
      expect(result.password_hash).not.toEqual('password123'); // Password should be hashed
    });

    it('should save user to database', async () => {
      const result = await registerUser(validRegisterInput);

      // Query the user from database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].password_hash).toBeDefined();
      expect(users[0].password_hash).not.toEqual('password123'); // Password should be hashed
      expect(users[0].created_at).toBeInstanceOf(Date);
    });

    it('should fail to register user with duplicate username', async () => {
      // Register first user
      await registerUser(validRegisterInput);
      
      // Try to register another user with the same username
      await expect(registerUser(validRegisterInput)).rejects.toThrow();
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      // Register a user before each authentication test
      await registerUser(validRegisterInput);
    });

    it('should authenticate a valid user', async () => {
      const result = await authenticateUser(validLoginInput);

      expect(result).not.toBeNull();
      expect(result!.username).toEqual('testuser');
      expect(result!.id).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent user', async () => {
      const result = await authenticateUser({
        username: 'nonexistent',
        password: 'password123'
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const result = await authenticateUser(invalidLoginInput);

      expect(result).toBeNull();
    });
  });
});
