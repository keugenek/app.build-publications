import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all users from database', async () => {
    // Create test users
    const testUsers = [
      {
        username: 'testuser1',
        email: 'test1@example.com'
      },
      {
        username: 'testuser2', 
        email: 'test2@example.com'
      },
      {
        username: 'testuser3',
        email: 'test3@example.com'
      }
    ];

    // Insert test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned
    expect(result[0].username).toEqual('testuser1');
    expect(result[0].email).toEqual('test1@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].username).toEqual('testuser2');
    expect(result[1].email).toEqual('test2@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    expect(result[2].username).toEqual('testuser3');
    expect(result[2].email).toEqual('test3@example.com');
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return users in order they were created', async () => {
    // Create test users sequentially
    await db.insert(usersTable)
      .values({ username: 'first', email: 'first@example.com' })
      .execute();

    await db.insert(usersTable)
      .values({ username: 'second', email: 'second@example.com' })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('first');
    expect(result[1].username).toEqual('second');
    
    // Verify created_at ordering (first user should have earlier timestamp)
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle large number of users', async () => {
    // Create 50 test users
    const testUsers = Array.from({ length: 50 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@example.com`
    }));

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(50);
    
    // Verify each user has proper structure
    result.forEach((user, index) => {
      expect(user.id).toBeDefined();
      expect(user.username).toEqual(`user${index}`);
      expect(user.email).toEqual(`user${index}@example.com`);
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should preserve user data integrity', async () => {
    // Create user with specific data
    const testUser = {
      username: 'integrity_test',
      email: 'integrity@example.com'
    };

    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    
    const user = result[0];
    expect(user.username).toEqual('integrity_test');
    expect(user.email).toEqual('integrity@example.com');
    expect(typeof user.id).toEqual('number');
    expect(user.id).toBeGreaterThan(0);
    expect(user.created_at).toBeInstanceOf(Date);
    
    // Verify timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - user.created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });
});
