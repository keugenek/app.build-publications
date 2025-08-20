import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single user', async () => {
    // Create test user directly in database
    const testUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('testuser');
    expect(result[0].email).toEqual('test@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple users', async () => {
    // Create multiple test users
    const testUsers = [
      { username: 'user1', email: 'user1@example.com' },
      { username: 'user2', email: 'user2@example.com' },
      { username: 'user3', email: 'user3@example.com' }
    ];

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Check that all users are returned with correct fields
    const usernames = result.map(user => user.username);
    const emails = result.map(user => user.email);

    expect(usernames).toContain('user1');
    expect(usernames).toContain('user2');
    expect(usernames).toContain('user3');

    expect(emails).toContain('user1@example.com');
    expect(emails).toContain('user2@example.com');
    expect(emails).toContain('user3@example.com');

    // Verify all users have required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('number');
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return users in creation order', async () => {
    // Create users with slight delay to ensure different timestamps
    const user1 = { username: 'first_user', email: 'first@example.com' };
    const user2 = { username: 'second_user', email: 'second@example.com' };

    // Insert first user
    await db.insert(usersTable)
      .values(user1)
      .execute();

    // Small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second user
    await db.insert(usersTable)
      .values(user2)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify timestamps are different and in order
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should return users with all required schema fields', async () => {
    const testUser = {
      username: 'schema_test_user',
      email: 'schema@example.com'
    };

    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    
    const user = result[0];

    // Verify all User schema fields are present and correct types
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(user.username).toEqual('schema_test_user');
    expect(user.email).toEqual('schema@example.com');
  });
});
