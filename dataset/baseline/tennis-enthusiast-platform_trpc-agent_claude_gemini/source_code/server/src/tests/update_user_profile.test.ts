import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Helper function to create test user profile
const createTestUserProfile = async (profile: CreateUserProfileInput) => {
  const result = await db.insert(userProfilesTable)
    .values({
      name: profile.name,
      skill_level: profile.skill_level,
      location: profile.location
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test data
const testUserProfile: CreateUserProfileInput = {
  name: 'John Smith',
  skill_level: 'Intermediate',
  location: 'Austin, TX'
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a user profile', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Update all fields
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Jane Doe',
      skill_level: 'Advanced',
      location: 'Dallas, TX'
    };

    const result = await updateUserProfile(updateInput);

    // Verify the returned profile
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProfile.id);
    expect(result!.name).toEqual('Jane Doe');
    expect(result!.skill_level).toEqual('Advanced');
    expect(result!.location).toEqual('Dallas, TX');
    expect(result!.created_at).toEqual(createdProfile.created_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdProfile.updated_at.getTime());
  });

  it('should update only the name field', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Update only name
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Updated Name'
    };

    const result = await updateUserProfile(updateInput);

    // Verify only name was updated, other fields unchanged
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Name');
    expect(result!.skill_level).toEqual(testUserProfile.skill_level);
    expect(result!.location).toEqual(testUserProfile.location);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdProfile.updated_at.getTime());
  });

  it('should update only the skill level field', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update only skill level
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      skill_level: 'Professional'
    };

    const result = await updateUserProfile(updateInput);

    // Verify only skill level was updated
    expect(result).not.toBeNull();
    expect(result!.name).toEqual(testUserProfile.name);
    expect(result!.skill_level).toEqual('Professional');
    expect(result!.location).toEqual(testUserProfile.location);
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(createdProfile.updated_at.getTime());
  });

  it('should update only the location field', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update only location
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      location: 'Houston, TX'
    };

    const result = await updateUserProfile(updateInput);

    // Verify only location was updated
    expect(result).not.toBeNull();
    expect(result!.name).toEqual(testUserProfile.name);
    expect(result!.skill_level).toEqual(testUserProfile.skill_level);
    expect(result!.location).toEqual('Houston, TX');
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(createdProfile.updated_at.getTime());
  });

  it('should update multiple fields but not all', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update name and location, but not skill level
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Bob Wilson',
      location: 'San Antonio, TX'
    };

    const result = await updateUserProfile(updateInput);

    // Verify correct fields were updated
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Bob Wilson');
    expect(result!.skill_level).toEqual(testUserProfile.skill_level); // Unchanged
    expect(result!.location).toEqual('San Antonio, TX');
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(createdProfile.updated_at.getTime());
  });

  it('should return null when profile ID does not exist', async () => {
    // Try to update a non-existent profile
    const updateInput: UpdateUserProfileInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent User'
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update the profile
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id,
      name: 'Database Test User',
      skill_level: 'Expert'
    };

    await updateUserProfile(updateInput);

    // Verify changes were saved in the database
    const savedProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, createdProfile.id))
      .execute();

    expect(savedProfile).toHaveLength(1);
    expect(savedProfile[0].name).toEqual('Database Test User');
    expect(savedProfile[0].skill_level).toEqual('Expert');
    expect(savedProfile[0].location).toEqual(testUserProfile.location); // Unchanged
    expect(savedProfile[0].updated_at).toBeInstanceOf(Date);
    expect(savedProfile[0].updated_at.getTime()).toBeGreaterThanOrEqual(createdProfile.updated_at.getTime());
  });

  it('should always update the updated_at timestamp even with no other changes', async () => {
    // Create test user profile
    const createdProfile = await createTestUserProfile(testUserProfile);
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update with no field changes (only ID provided)
    const updateInput: UpdateUserProfileInput = {
      id: createdProfile.id
    };

    const result = await updateUserProfile(updateInput);

    // Verify updated_at was still updated
    expect(result).not.toBeNull();
    expect(result!.name).toEqual(testUserProfile.name); // Unchanged
    expect(result!.skill_level).toEqual(testUserProfile.skill_level); // Unchanged
    expect(result!.location).toEqual(testUserProfile.location); // Unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdProfile.updated_at.getTime());
  });
});
