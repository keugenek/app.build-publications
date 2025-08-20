import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when there are no users', async () => {
    const result = await getUsers();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all users from the database', async () => {
    // Insert a test user directly via DB
    const inserted = await db.insert(usersTable).values({ name: 'Alice' }).returning().execute();
    const insertedUser = inserted[0];

    const users = await getUsers();

    expect(users).toHaveLength(1);
    const user = users[0] as User;
    expect(user.id).toBe(insertedUser.id);
    expect(user.name).toBe('Alice');
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
