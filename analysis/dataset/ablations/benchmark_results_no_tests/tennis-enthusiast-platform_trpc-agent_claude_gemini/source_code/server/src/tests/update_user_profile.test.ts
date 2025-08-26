import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Helper to create a test user profile
const createTestProfile = async (): Promise<number> => {
  const testInput: CreateUserProfileInput = {
    name: 'John Doe',
    skill_level: 'Intermediate',
    city: 'San Francisco',
    state: 'California',
    bio: 'Love playing tennis on weekends'
  };

  const result = await db.insert(userProfilesTable)
    .values(testInput)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user profile with all fields', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateUserProfileInput = {
      id: profileId,
      name: 'Jane Smith',
      skill_level: 'Advanced',
      city: 'Los Angeles',
      state: 'California',
      bio: 'Competitive tennis player with 10+ years experience'
    };

    const result = await updateUserProfile(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(profileId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.skill_level).toEqual('Advanced');
    expect(result.city).toEqual('Los Angeles');
    expect(result.state).toEqual('California');
    expect(result.bio).toEqual('Competitive tennis player with 10+ years experience');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateUserProfileInput = {
      id: profileId,
      name: 'Updated Name',
      skill_level: 'Advanced'
    };

    const result = await updateUserProfile(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Updated Name');
    expect(result.skill_level).toEqual('Advanced');

    // Verify unchanged fields remain the same
    expect(result.city).toEqual('San Francisco');
    expect(result.state).toEqual('California');
    expect(result.bio).toEqual('Love playing tennis on weekends');
  });

  it('should update single field', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateUserProfileInput = {
      id: profileId,
      bio: 'New bio content'
    };

    const result = await updateUserProfile(updateInput);

    // Verify only bio is updated
    expect(result.bio).toEqual('New bio content');
    expect(result.name).toEqual('John Doe');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.city).toEqual('San Francisco');
    expect(result.state).toEqual('California');
  });

  it('should save updates to database', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateUserProfileInput = {
      id: profileId,
      name: 'Database Test',
      city: 'New York'
    };

    await updateUserProfile(updateInput);

    // Verify changes are persisted in database
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, profileId))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('Database Test');
    expect(profiles[0].city).toEqual('New York');
    expect(profiles[0].state).toEqual('California'); // Unchanged
  });

  it('should return unchanged profile when no fields provided', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateUserProfileInput = {
      id: profileId
    };

    const result = await updateUserProfile(updateInput);

    // Verify original values are returned
    expect(result.name).toEqual('John Doe');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.city).toEqual('San Francisco');
    expect(result.state).toEqual('California');
    expect(result.bio).toEqual('Love playing tennis on weekends');
  });

  it('should throw error for non-existent profile', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateUserProfileInput = {
      id: nonExistentId,
      name: 'Should Fail'
    };

    await expect(updateUserProfile(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle skill level updates correctly', async () => {
    const profileId = await createTestProfile();

    // Test each skill level
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;

    for (const skillLevel of skillLevels) {
      const updateInput: UpdateUserProfileInput = {
        id: profileId,
        skill_level: skillLevel
      };

      const result = await updateUserProfile(updateInput);
      expect(result.skill_level).toEqual(skillLevel);
    }
  });

  it('should preserve created_at timestamp', async () => {
    const profileId = await createTestProfile();

    // Get original created_at
    const originalProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, profileId))
      .execute();

    const originalCreatedAt = originalProfile[0].created_at;

    const updateInput: UpdateUserProfileInput = {
      id: profileId,
      name: 'Timestamp Test'
    };

    const result = await updateUserProfile(updateInput);

    // Verify created_at is preserved
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
