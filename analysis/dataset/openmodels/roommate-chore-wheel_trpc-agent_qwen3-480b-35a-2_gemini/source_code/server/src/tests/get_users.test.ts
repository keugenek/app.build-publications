import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users when users exist', async () => {
    // Insert test users
    const testUsers = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' }
    ];

    for (const user of testUsers) {
      await db.insert(usersTable)
        .values(user)
        .execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Check that all test users are returned
    const userNames = result.map(user => user.name);
    expect(userNames).toContain('Alice');
    expect(userNames).toContain('Bob');
    expect(userNames).toContain('Charlie');
    
    // Check that all users have required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return users with correct data types', async () => {
    // Insert a test user
    await db.insert(usersTable)
      .values({ name: 'Test User' })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    
    const user = result[0];
    expect(typeof user.id).toBe('number');
    expect(typeof user.name).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
