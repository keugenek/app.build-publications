import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

// Helper to insert a user directly
const insertUser = async (email: string, passwordHash: string) => {
  const result = await db.insert(usersTable)
    .values({ email, password_hash: passwordHash })
    .returning()
    .execute();
  return result[0];
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no users exist', async () => {
    const users = await getUsers();
    expect(users).toEqual([]);
  });

  it('should fetch all users from the database', async () => {
    // Insert two users
    const user1 = await insertUser('alice@example.com', 'hash1');
    const user2 = await insertUser('bob@example.com', 'hash2');

    const users = await getUsers();

    // Verify both users are returned
    expect(users).toHaveLength(2);
    const emails = users.map(u => u.email).sort();
    expect(emails).toEqual(['alice@example.com', 'bob@example.com']);

    // Verify fields and types
    const fetchedUser1 = users.find(u => u.email === 'alice@example.com')!;
    expect(fetchedUser1.id).toBe(user1.id);
    expect(fetchedUser1.password_hash).toBe('hash1');
    expect(fetchedUser1.created_at).toBeInstanceOf(Date);
  });

  it('should correctly map numeric and date fields', async () => {
    const inserted = await insertUser('charlie@example.com', 'hash3');
    const users = await getUsers();
    const charlie = users.find(u => u.email === 'charlie@example.com')!;
    expect(typeof charlie.id).toBe('number');
    expect(charlie.created_at).toBeInstanceOf(Date);
    // Ensure id matches inserted record
    expect(charlie.id).toBe(inserted.id);
  });
});
