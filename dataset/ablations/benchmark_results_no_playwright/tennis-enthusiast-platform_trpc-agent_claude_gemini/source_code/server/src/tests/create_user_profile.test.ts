import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createUserProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserProfileInput = {
  name: 'John Doe',
  bio: 'Passionate tennis player looking to improve my game',
  skill_level: 'Intermediate',
  location: 'New York, NY'
};

// Test input with nullable bio
const testInputWithNullBio: CreateUserProfileInput = {
  name: 'Jane Smith',
  bio: null,
  skill_level: 'Beginner',
  location: 'Los Angeles, CA'
};

describe('createUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile with all fields', async () => {
    const result = await createUserProfile(testInput);

    // Validate returned profile structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.name).toEqual('John Doe');
    expect(result.bio).toEqual('Passionate tennis player looking to improve my game');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.location).toEqual('New York, NY');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user profile with null bio', async () => {
    const result = await createUserProfile(testInputWithNullBio);

    // Validate returned profile structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.name).toEqual('Jane Smith');
    expect(result.bio).toBeNull();
    expect(result.skill_level).toEqual('Beginner');
    expect(result.location).toEqual('Los Angeles, CA');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user profile to database', async () => {
    const result = await createUserProfile(testInput);

    // Query the database to verify the profile was saved
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const savedProfile = profiles[0];
    
    expect(savedProfile.name).toEqual('John Doe');
    expect(savedProfile.bio).toEqual('Passionate tennis player looking to improve my game');
    expect(savedProfile.skill_level).toEqual('Intermediate');
    expect(savedProfile.location).toEqual('New York, NY');
    expect(savedProfile.created_at).toBeInstanceOf(Date);
    expect(savedProfile.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple unique user profiles', async () => {
    const firstProfile = await createUserProfile(testInput);
    const secondProfile = await createUserProfile(testInputWithNullBio);

    // Verify both profiles have unique IDs
    expect(firstProfile.id).not.toEqual(secondProfile.id);

    // Verify both profiles exist in database
    const allProfiles = await db.select()
      .from(userProfilesTable)
      .execute();

    expect(allProfiles).toHaveLength(2);
    
    // Verify profile contents
    const johnProfile = allProfiles.find(p => p.name === 'John Doe');
    const janeProfile = allProfiles.find(p => p.name === 'Jane Smith');

    expect(johnProfile).toBeDefined();
    expect(johnProfile?.skill_level).toEqual('Intermediate');
    expect(johnProfile?.bio).toEqual('Passionate tennis player looking to improve my game');

    expect(janeProfile).toBeDefined();
    expect(janeProfile?.skill_level).toEqual('Beginner');
    expect(janeProfile?.bio).toBeNull();
  });

  it('should handle all skill levels correctly', async () => {
    const beginnerInput: CreateUserProfileInput = {
      name: 'Beginner Player',
      bio: 'Just started playing tennis',
      skill_level: 'Beginner',
      location: 'Chicago, IL'
    };

    const advancedInput: CreateUserProfileInput = {
      name: 'Advanced Player',
      bio: 'Tournament-level player',
      skill_level: 'Advanced',
      location: 'Miami, FL'
    };

    const beginnerResult = await createUserProfile(beginnerInput);
    const advancedResult = await createUserProfile(advancedInput);

    expect(beginnerResult.skill_level).toEqual('Beginner');
    expect(advancedResult.skill_level).toEqual('Advanced');

    // Verify in database
    const profiles = await db.select()
      .from(userProfilesTable)
      .execute();

    expect(profiles).toHaveLength(2);
    const skillLevels = profiles.map(p => p.skill_level);
    expect(skillLevels).toContain('Beginner');
    expect(skillLevels).toContain('Advanced');
  });
});
