import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create a test user
    const insertResult = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const input: GetUserByIdInput = { id: createdUser.id };

    const result = await getUserById(input);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdUser.id);
    expect(result?.name).toEqual('John Doe');
    expect(result?.email).toEqual('john@example.com');
    expect(result?.role).toEqual('member');
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const input: GetUserByIdInput = { id: 99999 };

    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should handle different user roles correctly', async () => {
    // Create users with different roles
    const adminUser = await db.insert(usersTable)
      .values({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      })
      .returning()
      .execute();

    const instructorUser = await db.insert(usersTable)
      .values({
        name: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Test admin user
    const adminResult = await getUserById({ id: adminUser[0].id });
    expect(adminResult?.role).toEqual('admin');

    // Test instructor user
    const instructorResult = await getUserById({ id: instructorUser[0].id });
    expect(instructorResult?.role).toEqual('instructor');
  });

  it('should handle users with special characters in data', async () => {
    // Create user with special characters
    const userWithSpecialChars = await db.insert(usersTable)
      .values({
        name: 'José María O\'Connor',
        email: 'jose.maria@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const result = await getUserById({ id: userWithSpecialChars[0].id });

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('José María O\'Connor');
    expect(result?.email).toEqual('jose.maria@example.com');
  });

  it('should return the correct user when multiple users exist', async () => {
    // Create multiple users
    const users = await db.insert(usersTable)
      .values([
        { name: 'User 1', email: 'user1@example.com', role: 'member' },
        { name: 'User 2', email: 'user2@example.com', role: 'admin' },
        { name: 'User 3', email: 'user3@example.com', role: 'instructor' }
      ])
      .returning()
      .execute();

    // Test that we get the correct user (middle one)
    const result = await getUserById({ id: users[1].id });

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(users[1].id);
    expect(result?.name).toEqual('User 2');
    expect(result?.email).toEqual('user2@example.com');
    expect(result?.role).toEqual('admin');
  });
});
