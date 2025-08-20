import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a user directly in the DB
const createTestUser = async (): Promise<User> => {
  const [inserted] = await db
    .insert(usersTable)
    .values({
      username: 'original_user',
      skill_level: 'BEGINNER',
      location: 'Earth',
      profile_picture_url: null,
    })
    .returning()
    .execute();
  // The returned row already matches the Zod User type shape
  return {
    id: inserted.id,
    username: inserted.username,
    skill_level: inserted.skill_level,
    location: inserted.location,
    profile_picture_url: inserted.profile_picture_url ?? null,
    created_at: inserted.created_at,
  } as User;
};

describe('updateUser handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates only provided fields and leaves others untouched', async () => {
    const original = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: original.id,
      username: 'updated_user',
      // skill_level omitted on purpose
      location: 'Mars',
      // profile_picture_url explicitly set to null to test nullable handling
      profile_picture_url: null,
    };

    const updated = await updateUser(updateInput);

    // Verify changed fields
    expect(updated.id).toBe(original.id);
    expect(updated.username).toBe('updated_user');
    expect(updated.location).toBe('Mars');
    expect(updated.profile_picture_url).toBeNull();

    // Verify untouched field retains original value
    expect(updated.skill_level).toBe(original.skill_level);

    // Verify created_at is unchanged (same timestamp)
    expect(updated.created_at).toEqual(original.created_at);
  });

  it('updates nullable profile_picture_url when provided', async () => {
    const original = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: original.id,
      profile_picture_url: 'http://example.com/avatar.png',
    };

    const updated = await updateUser(updateInput);

    expect(updated.profile_picture_url).toBe('http://example.com/avatar.png');
    // All other fields stay the same
    expect(updated.username).toBe(original.username);
    expect(updated.location).toBe(original.location);
    expect(updated.skill_level).toBe(original.skill_level);
  });
});
