import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { type User } from '../schema';

// Helper to insert a user directly
const insertUser = async (user: Omit<User, 'id' | 'created_at'>) => {
  const [result] = await db.insert(usersTable)
    .values({
      username: user.username,
      skill_level: user.skill_level,
      location: user.location,
      profile_picture_url: user.profile_picture_url ?? undefined,
    })
    .returning()
    .execute();
  return result;
};

describe('getUsers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no users exist', async () => {
    const users = await getUsers();
    expect(users).toBeArray();
    expect(users).toHaveLength(0);
  });

  it('should fetch all users from the database', async () => {
    // Insert two users
    const user1 = await insertUser({
      username: 'alice',
      skill_level: 'BEGINNER',
      location: 'NY',
      profile_picture_url: null,
    });
    const user2 = await insertUser({
      username: 'bob',
      skill_level: 'ADVANCED',
      location: 'LA',
      profile_picture_url: 'http://example.com/bob.png',
    });

    const users = await getUsers();
    expect(users).toHaveLength(2);
    const usernames = users.map(u => u.username);
    expect(usernames).toContain('alice');
    expect(usernames).toContain('bob');

    // Verify fields of first user (alice)
    const alice = users.find(u => u.username === 'alice')!;
    expect(alice.skill_level).toBe('BEGINNER');
    expect(alice.location).toBe('NY');
    expect(alice.profile_picture_url).toBeNull();
    expect(alice.created_at).toBeInstanceOf(Date);

    // Verify fields of second user (bob)
    const bob = users.find(u => u.username === 'bob')!;
    expect(bob.skill_level).toBe('ADVANCED');
    expect(bob.location).toBe('LA');
    expect(bob.profile_picture_url).toBe('http://example.com/bob.png');
    expect(bob.created_at).toBeInstanceOf(Date);
  });
});
