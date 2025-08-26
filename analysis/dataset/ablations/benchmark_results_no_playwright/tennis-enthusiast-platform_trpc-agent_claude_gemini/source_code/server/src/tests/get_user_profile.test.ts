import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { getUserProfile } from '../handlers/get_user_profile';

// Test input for creating a user profile
const testUserInput: CreateUserProfileInput = {
  name: 'John Doe',
  bio: 'Passionate tennis player looking for practice partners',
  skill_level: 'Intermediate',
  location: 'New York, NY'
};

const testUserInput2: CreateUserProfileInput = {
  name: 'Jane Smith',
  bio: null,
  skill_level: 'Advanced',
  location: 'Los Angeles, CA'
};

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create a test user first
    const insertResult = await db.insert(userProfilesTable)
      .values({
        name: testUserInput.name,
        bio: testUserInput.bio,
        skill_level: testUserInput.skill_level,
        location: testUserInput.location
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Fetch the user profile using the handler
    const result = await getUserProfile(createdUser.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.bio).toEqual('Passionate tennis player looking for practice partners');
    expect(result!.skill_level).toEqual('Intermediate');
    expect(result!.location).toEqual('New York, NY');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return user profile with null bio when bio is null', async () => {
    // Create a test user with null bio
    const insertResult = await db.insert(userProfilesTable)
      .values({
        name: testUserInput2.name,
        bio: testUserInput2.bio,
        skill_level: testUserInput2.skill_level,
        location: testUserInput2.location
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Fetch the user profile using the handler
    const result = await getUserProfile(createdUser.id);

    // Verify the result handles null bio correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.bio).toBeNull();
    expect(result!.skill_level).toEqual('Advanced');
    expect(result!.location).toEqual('Los Angeles, CA');
  });

  it('should return null when user does not exist', async () => {
    // Try to fetch a non-existent user
    const result = await getUserProfile(999999);

    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    const insertResult1 = await db.insert(userProfilesTable)
      .values({
        name: testUserInput.name,
        bio: testUserInput.bio,
        skill_level: testUserInput.skill_level,
        location: testUserInput.location
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(userProfilesTable)
      .values({
        name: testUserInput2.name,
        bio: testUserInput2.bio,
        skill_level: testUserInput2.skill_level,
        location: testUserInput2.location
      })
      .returning()
      .execute();

    const user1 = insertResult1[0];
    const user2 = insertResult2[0];

    // Fetch each user individually and verify correct data is returned
    const result1 = await getUserProfile(user1.id);
    const result2 = await getUserProfile(user2.id);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(user1.id);
    expect(result1!.name).toEqual('John Doe');
    expect(result1!.skill_level).toEqual('Intermediate');

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(user2.id);
    expect(result2!.name).toEqual('Jane Smith');
    expect(result2!.skill_level).toEqual('Advanced');
  });

  it('should handle edge case with user ID 0', async () => {
    // Try to fetch user with ID 0 (which shouldn't exist due to serial primary key starting at 1)
    const result = await getUserProfile(0);

    expect(result).toBeNull();
  });

  it('should handle negative user ID', async () => {
    // Try to fetch user with negative ID
    const result = await getUserProfile(-1);

    expect(result).toBeNull();
  });
});
