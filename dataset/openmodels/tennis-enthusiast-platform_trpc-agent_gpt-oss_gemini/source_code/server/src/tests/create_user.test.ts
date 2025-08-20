import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs
const baseInput: CreateUserInput = {
  username: 'test_user',
  skill_level: 'BEGINNER',
  location: 'Test City',
  profile_picture_url: 'http://example.com/avatar.png',
};

const inputWithoutPicture: CreateUserInput = {
  username: 'no_pic_user',
  skill_level: 'INTERMEDIATE',
  location: 'Another City',
  // profile_picture_url omitted (optional)
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(baseInput);

    expect(result.id).toBeDefined();
    expect(result.username).toBe(baseInput.username);
    expect(result.skill_level).toBe(baseInput.skill_level);
    expect(result.location).toBe(baseInput.location);
    expect(result.profile_picture_url).toBe(baseInput.profile_picture_url as string | null);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the user in the database', async () => {
    const result = await createUser(baseInput);

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.username).toBe(baseInput.username);
    expect(user.skill_level).toBe(baseInput.skill_level);
    expect(user.location).toBe(baseInput.location);
    expect(user.profile_picture_url).toBe(baseInput.profile_picture_url as string);
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should handle missing optional profile_picture_url as null', async () => {
    const result = await createUser(inputWithoutPicture);
    expect(result.profile_picture_url).toBeNull();

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.profile_picture_url).toBeNull();
  });
});
