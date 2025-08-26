import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { getUserProfile } from '../handlers/get_user_profile';

// Test user profile data
const testUser: CreateUserProfileInput = {
  name: 'John Doe',
  skill_level: 'Intermediate',
  city: 'San Francisco',
  state: 'California',
  bio: 'Love playing tennis and looking for practice partners!'
};

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create a test user
    const insertResult = await db.insert(userProfilesTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = insertResult[0];

    // Fetch the user profile
    const result = await getUserProfile(createdUser.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.skill_level).toEqual('Intermediate');
    expect(result!.city).toEqual('San Francisco');
    expect(result!.state).toEqual('California');
    expect(result!.bio).toEqual('Love playing tennis and looking for practice partners!');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    // Try to fetch a non-existent user
    const result = await getUserProfile(999);

    // Should return null
    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    const user1 = await db.insert(userProfilesTable)
      .values({
        name: 'Alice Johnson',
        skill_level: 'Beginner',
        city: 'New York',
        state: 'New York',
        bio: 'Just started playing tennis!'
      })
      .returning()
      .execute();

    const user2 = await db.insert(userProfilesTable)
      .values({
        name: 'Bob Smith',
        skill_level: 'Advanced',
        city: 'Los Angeles',
        state: 'California',
        bio: 'Tournament player looking for challenging matches.'
      })
      .returning()
      .execute();

    // Fetch the second user
    const result = await getUserProfile(user2[0].id);

    // Should return the correct user
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(user2[0].id);
    expect(result!.name).toEqual('Bob Smith');
    expect(result!.skill_level).toEqual('Advanced');
    expect(result!.city).toEqual('Los Angeles');
    expect(result!.state).toEqual('California');
    expect(result!.bio).toEqual('Tournament player looking for challenging matches.');
  });

  it('should handle negative user IDs gracefully', async () => {
    // Try to fetch with negative ID
    const result = await getUserProfile(-1);

    // Should return null
    expect(result).toBeNull();
  });

  it('should handle zero user ID gracefully', async () => {
    // Try to fetch with zero ID
    const result = await getUserProfile(0);

    // Should return null
    expect(result).toBeNull();
  });
});
