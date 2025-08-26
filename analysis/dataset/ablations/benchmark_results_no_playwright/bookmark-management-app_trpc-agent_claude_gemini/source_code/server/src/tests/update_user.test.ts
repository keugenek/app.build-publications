import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';


describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test user
  const createTestUser = async () => {
    const hashedPassword = await Bun.password.hash('original_password');
    const result = await db.insert(usersTable)
      .values({
        username: 'original_user',
        email: 'original@example.com',
        password_hash: hashedPassword
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update user username', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      username: 'updated_user'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(user.id);
    expect(result.username).toEqual('updated_user');
    expect(result.email).toEqual(user.email);
    expect(result.password_hash).toEqual(user.password_hash);
    expect(result.created_at).toEqual(user.created_at);
    expect(result.updated_at).not.toEqual(user.updated_at);
  });

  it('should update user email', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      email: 'updated@example.com'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(user.id);
    expect(result.username).toEqual(user.username);
    expect(result.email).toEqual('updated@example.com');
    expect(result.password_hash).toEqual(user.password_hash);
    expect(result.updated_at).not.toEqual(user.updated_at);
  });

  it('should update user password and hash it', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      password: 'new_password'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(user.id);
    expect(result.username).toEqual(user.username);
    expect(result.email).toEqual(user.email);
    expect(result.password_hash).not.toEqual(user.password_hash);
    expect(result.updated_at).not.toEqual(user.updated_at);

    // Verify the new password is properly hashed
    const passwordMatches = await Bun.password.verify('new_password', result.password_hash);
    expect(passwordMatches).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      username: 'multi_update',
      email: 'multi@example.com',
      password: 'multi_password'
    };

    const result = await updateUser(input);

    expect(result.username).toEqual('multi_update');
    expect(result.email).toEqual('multi@example.com');
    expect(result.password_hash).not.toEqual(user.password_hash);

    const passwordMatches = await Bun.password.verify('multi_password', result.password_hash);
    expect(passwordMatches).toBe(true);
  });

  it('should save updated user to database', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      username: 'db_updated'
    };

    const result = await updateUser(input);

    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(savedUser).toHaveLength(1);
    expect(savedUser[0].username).toEqual('db_updated');
    expect(savedUser[0].updated_at).toEqual(result.updated_at);
  });

  it('should throw error when user does not exist', async () => {
    const input: UpdateUserInput = {
      id: 999,
      username: 'nonexistent'
    };

    await expect(updateUser(input)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should throw error when username already exists', async () => {
    const user1 = await createTestUser();
    
    // Create second user
    const hashedPassword = await Bun.password.hash('password2');
    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: user2[0].id,
      username: user1.username // Try to use existing username
    };

    await expect(updateUser(input)).rejects.toThrow(/Username already exists/i);
  });

  it('should throw error when email already exists', async () => {
    const user1 = await createTestUser();
    
    // Create second user
    const hashedPassword = await Bun.password.hash('password2');
    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: user2[0].id,
      email: user1.email // Try to use existing email
    };

    await expect(updateUser(input)).rejects.toThrow(/Email already exists/i);
  });

  it('should allow user to keep same username and email', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id,
      username: user.username, // Same username
      email: user.email // Same email
    };

    const result = await updateUser(input);

    expect(result.username).toEqual(user.username);
    expect(result.email).toEqual(user.email);
    expect(result.updated_at).not.toEqual(user.updated_at);
  });

  it('should update only updated_at when no fields provided', async () => {
    const user = await createTestUser();
    const input: UpdateUserInput = {
      id: user.id
    };

    const result = await updateUser(input);

    expect(result.username).toEqual(user.username);
    expect(result.email).toEqual(user.email);
    expect(result.password_hash).toEqual(user.password_hash);
    expect(result.updated_at).not.toEqual(user.updated_at);
  });
});
