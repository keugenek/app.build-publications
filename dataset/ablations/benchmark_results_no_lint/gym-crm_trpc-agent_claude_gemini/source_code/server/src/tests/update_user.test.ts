import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async (userData: CreateUserInput) => {
    const result = await db.insert(usersTable)
      .values(userData)
      .returning()
      .execute();
    return result[0];
  };

  it('should update user name only', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      name: 'Jane Smith'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('john@example.com'); // Should remain unchanged
    expect(result.role).toEqual('member'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update user email only', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.email).toEqual('newemail@example.com');
    expect(result.role).toEqual('member'); // Should remain unchanged
  });

  it('should update user role only', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.email).toEqual('john@example.com'); // Should remain unchanged
    expect(result.role).toEqual('admin');
  });

  it('should update multiple fields at once', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'instructor'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane@example.com');
    expect(result.role).toEqual('instructor');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated user to database', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      name: 'Updated Name',
      role: 'admin'
    };

    await updateUser(updateInput);

    // Verify the changes were saved to database
    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUser.id))
      .execute();

    expect(savedUser).toHaveLength(1);
    expect(savedUser[0].name).toEqual('Updated Name');
    expect(savedUser[0].email).toEqual('john@example.com'); // Should remain unchanged
    expect(savedUser[0].role).toEqual('admin');
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 999,
      name: 'Non-existent User'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should throw error for duplicate email', async () => {
    // Create two test users
    const user1 = await createTestUser({
      name: 'User One',
      email: 'user1@example.com',
      role: 'member'
    });

    const user2 = await createTestUser({
      name: 'User Two',
      email: 'user2@example.com',
      role: 'member'
    });

    // Try to update user2 with user1's email
    const updateInput: UpdateUserInput = {
      id: user2.id,
      email: 'user1@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/Email user1@example.com is already in use/i);
  });

  it('should allow updating to same email', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id,
      name: 'Updated Name',
      email: 'john@example.com' // Same email
    };

    const result = await updateUser(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('john@example.com');
  });

  it('should handle updating with empty update object', async () => {
    // Create test user
    const testUser = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member'
    });

    const updateInput: UpdateUserInput = {
      id: testUser.id
      // No fields to update
    };

    const result = await updateUser(updateInput);

    // Should return the user unchanged
    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.role).toEqual('member');
  });
});
