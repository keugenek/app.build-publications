import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type GetUserProfileInput, type CreateUserProfileInput } from '../schema';
import { getUserProfile } from '../handlers/get_user_profile';
import { eq } from 'drizzle-orm';

// Test input for creating a user profile
const testUserProfile: CreateUserProfileInput = {
  name: 'John Doe',
  skill_level: 'Intermediate',
  location: 'Austin, TX'
};

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when it exists', async () => {
    // Create a test user profile first
    const createResult = await db.insert(userProfilesTable)
      .values(testUserProfile)
      .returning()
      .execute();

    const createdProfile = createResult[0];
    
    // Test input
    const input: GetUserProfileInput = {
      id: createdProfile.id
    };

    const result = await getUserProfile(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdProfile.id);
    expect(result?.name).toEqual('John Doe');
    expect(result?.skill_level).toEqual('Intermediate');
    expect(result?.location).toEqual('Austin, TX');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user profile does not exist', async () => {
    // Test with a non-existent ID
    const input: GetUserProfileInput = {
      id: 999999
    };

    const result = await getUserProfile(input);

    expect(result).toBeNull();
  });

  it('should return correct profile when multiple profiles exist', async () => {
    // Create multiple test user profiles
    const profile1Data = {
      name: 'Alice Smith',
      skill_level: 'Beginner',
      location: 'Dallas, TX'
    };

    const profile2Data = {
      name: 'Bob Johnson',
      skill_level: 'Advanced',
      location: 'Houston, TX'
    };

    const createResults = await db.insert(userProfilesTable)
      .values([profile1Data, profile2Data])
      .returning()
      .execute();

    const profile1 = createResults[0];
    const profile2 = createResults[1];

    // Test getting the first profile
    const input1: GetUserProfileInput = {
      id: profile1.id
    };

    const result1 = await getUserProfile(input1);

    expect(result1).not.toBeNull();
    expect(result1?.id).toEqual(profile1.id);
    expect(result1?.name).toEqual('Alice Smith');
    expect(result1?.skill_level).toEqual('Beginner');
    expect(result1?.location).toEqual('Dallas, TX');

    // Test getting the second profile
    const input2: GetUserProfileInput = {
      id: profile2.id
    };

    const result2 = await getUserProfile(input2);

    expect(result2).not.toBeNull();
    expect(result2?.id).toEqual(profile2.id);
    expect(result2?.name).toEqual('Bob Johnson');
    expect(result2?.skill_level).toEqual('Advanced');
    expect(result2?.location).toEqual('Houston, TX');
  });

  it('should handle database query correctly', async () => {
    // Create a test user profile
    const createResult = await db.insert(userProfilesTable)
      .values(testUserProfile)
      .returning()
      .execute();

    const createdProfile = createResult[0];

    // Get the profile using the handler
    const input: GetUserProfileInput = {
      id: createdProfile.id
    };

    const result = await getUserProfile(input);

    // Verify the profile exists in database
    const dbResults = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, createdProfile.id))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(result?.id).toEqual(dbResults[0].id);
    expect(result?.name).toEqual(dbResults[0].name);
    expect(result?.created_at).toEqual(dbResults[0].created_at);
  });
});
