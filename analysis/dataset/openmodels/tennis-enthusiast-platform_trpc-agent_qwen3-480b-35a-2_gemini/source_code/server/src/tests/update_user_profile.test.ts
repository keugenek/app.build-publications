import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UpdateUserProfileInput } from '../schema';
import { updateProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Test data for creating a user profile
const createInput: CreateUserProfileInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'A passionate tennis player'
};

// Helper function to create a user profile for testing
const createUserProfile = async (input: CreateUserProfileInput) => {
  const result = await db.insert(userProfilesTable)
    .values({
      name: input.name,
      email: input.email,
      skill_level: input.skill_level,
      location: input.location,
      bio: input.bio
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user profile with all fields', async () => {
    // First create a user profile
    const createdProfile = await createUserProfile(createInput);
    
    // Update all fields
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      skill_level: 'advanced',
      location: 'Los Angeles',
      bio: 'Professional tennis coach'
    };

    const result = await updateProfile(updateInput);

    // Validate the returned data
    expect(result.id).toEqual(createdProfile.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.skill_level).toEqual('advanced');
    expect(result.location).toEqual('Los Angeles');
    expect(result.bio).toEqual('Professional tennis coach');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update a user profile with partial fields', async () => {
    // First create a user profile
    const createdProfile = await createUserProfile(createInput);
    
    // Update only name and location
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Jane Smith',
      location: 'Los Angeles'
    };

    const result = await updateProfile(updateInput);

    // Validate the returned data - only updated fields should change
    expect(result.id).toEqual(createdProfile.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual(createdProfile.email); // Should remain unchanged
    expect(result.skill_level).toEqual(createdProfile.skill_level); // Should remain unchanged
    expect(result.location).toEqual('Los Angeles');
    expect(result.bio).toEqual(createdProfile.bio); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should save updated profile to database', async () => {
    // First create a user profile
    const createdProfile = await createUserProfile(createInput);
    
    // Update the profile
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const result = await updateProfile(updateInput);

    // Query the database to verify changes were saved
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, createdProfile.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toEqual(createdProfile.id);
    expect(profiles[0].name).toEqual('Updated Name');
    expect(profiles[0].email).toEqual('updated@example.com');
    expect(profiles[0].skill_level).toEqual(createdProfile.skill_level); // Should remain unchanged
    expect(profiles[0].location).toEqual(createdProfile.location); // Should remain unchanged
    expect(profiles[0].bio).toEqual(createdProfile.bio); // Should remain unchanged
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at.getTime()).toBeGreaterThanOrEqual(profiles[0].created_at.getTime());
  });

  it('should throw an error when trying to update a non-existent profile', async () => {
    const updateInput: UpdateUserProfileInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent User'
    };

    await expect(updateProfile(updateInput))
      .rejects
      .toThrow(/not found/);
  });

  it('should handle null bio correctly', async () => {
    // First create a user profile
    const createdProfile = await createUserProfile(createInput);
    
    // Update bio to null
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      bio: null
    };

    const result = await updateProfile(updateInput);

    // Validate the returned data
    expect(result.id).toEqual(createdProfile.id);
    expect(result.bio).toBeNull();
    
    // Verify in database
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, createdProfile.id))
      .execute();
    
    expect(profiles[0].bio).toBeNull();
  });
});
