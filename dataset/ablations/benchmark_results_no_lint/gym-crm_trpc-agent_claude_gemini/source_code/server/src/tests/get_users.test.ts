import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers, type GetUsersFilters } from '../handlers/get_users';

// Test users for different scenarios
const testUsers: CreateUserInput[] = [
  {
    name: 'John Member',
    email: 'john@example.com',
    role: 'member'
  },
  {
    name: 'Jane Admin',
    email: 'jane@example.com',
    role: 'admin'
  },
  {
    name: 'Bob Instructor',
    email: 'bob@example.com',
    role: 'instructor'
  },
  {
    name: 'Alice Member',
    email: 'alice@example.com',
    role: 'member'
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should fetch all users when no filter is provided', async () => {
    // Insert test users
    await db.insert(usersTable).values(testUsers).execute();

    const result = await getUsers();

    expect(result).toHaveLength(4);
    expect(result.map(u => u.name).sort()).toEqual([
      'Alice Member',
      'Bob Instructor', 
      'Jane Admin',
      'John Member'
    ]);

    // Verify all fields are present and correct types
    result.forEach(user => {
      expect(user.id).toBeTypeOf('number');
      expect(user.name).toBeTypeOf('string');
      expect(user.email).toBeTypeOf('string');
      expect(user.role).toMatch(/^(member|admin|instructor)$/);
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter users by member role', async () => {
    // Insert test users
    await db.insert(usersTable).values(testUsers).execute();

    const filters: GetUsersFilters = { role: 'member' };
    const result = await getUsers(filters);

    expect(result).toHaveLength(2);
    result.forEach(user => {
      expect(user.role).toBe('member');
    });

    const memberNames = result.map(u => u.name).sort();
    expect(memberNames).toEqual(['Alice Member', 'John Member']);
  });

  it('should filter users by admin role', async () => {
    // Insert test users
    await db.insert(usersTable).values(testUsers).execute();

    const filters: GetUsersFilters = { role: 'admin' };
    const result = await getUsers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('admin');
    expect(result[0].name).toBe('Jane Admin');
  });

  it('should filter users by instructor role', async () => {
    // Insert test users
    await db.insert(usersTable).values(testUsers).execute();

    const filters: GetUsersFilters = { role: 'instructor' };
    const result = await getUsers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('instructor');
    expect(result[0].name).toBe('Bob Instructor');
  });

  it('should return empty array when filtering by role with no matches', async () => {
    // Insert only member users
    const memberUsers = testUsers.filter(u => u.role === 'member');
    await db.insert(usersTable).values(memberUsers).execute();

    const filters: GetUsersFilters = { role: 'admin' };
    const result = await getUsers(filters);

    expect(result).toHaveLength(0);
  });

  it('should handle empty filters object', async () => {
    // Insert test users
    await db.insert(usersTable).values(testUsers).execute();

    const result = await getUsers({});

    expect(result).toHaveLength(4);
    expect(result.map(u => u.name).sort()).toEqual([
      'Alice Member',
      'Bob Instructor', 
      'Jane Admin',
      'John Member'
    ]);
  });

  it('should maintain correct data types for all user fields', async () => {
    const singleUser: CreateUserInput = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    };

    await db.insert(usersTable).values([singleUser]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(typeof user.id).toBe('number');
    expect(typeof user.name).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('member');
  });
});
