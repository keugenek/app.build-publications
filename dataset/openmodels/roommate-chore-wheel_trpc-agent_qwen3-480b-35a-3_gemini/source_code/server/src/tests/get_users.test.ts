import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { type CreateUserInput } from '../schema';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from the database', async () => {
    // Insert test users
    const testUsers: CreateUserInput[] = [
      {
        name: 'John Doe',
        email: 'john@example.com'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      {
        name: 'Bob Johnson',
        email: null
      }
    ];

    // Insert users into database
    for (const user of testUsers) {
      await db.insert(usersTable)
        .values(user)
        .execute();
    }

    // Test the handler
    const result = await getUsers();

    // Verify results
    expect(result).toHaveLength(3);
    
    // Check that all users are returned with correct properties
    const john = result.find(u => u.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john!.email).toBe('john@example.com');
    expect(john!.created_at).toBeInstanceOf(Date);
    
    const jane = result.find(u => u.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane!.email).toBe('jane@example.com');
    expect(jane!.created_at).toBeInstanceOf(Date);
    
    const bob = result.find(u => u.name === 'Bob Johnson');
    expect(bob).toBeDefined();
    expect(bob!.email).toBeNull();
    expect(bob!.created_at).toBeInstanceOf(Date);
  });

  it('should handle users with null email values correctly', async () => {
    // Insert user with null email
    await db.insert(usersTable)
      .values({
        name: 'User Without Email',
        email: null
      })
      .execute();

    const result = await getUsers();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('User Without Email');
    expect(result[0].email).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
