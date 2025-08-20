import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type CreateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Test data for creating initial user profile
const initialUserData: CreateUserProfileInput = {
  name: 'John Doe',
  bio: 'Tennis enthusiast',
  skill_level: 'Intermediate',
  location: 'New York'
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user profile with all fields', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Update all fields
    const updateInput: UpdateUserProfileInput = {
      id: userId,
      name: 'Jane Smith',
      bio: 'Professional tennis player',
      skill_level: 'Advanced',
      location: 'Los Angeles'
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.bio).toEqual('Professional tennis player');
    expect(result!.skill_level).toEqual('Advanced');
    expect(result!.location).toEqual('Los Angeles');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update only specified fields', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update only name and skill level
    const updateInput: UpdateUserProfileInput = {
      id: userId,
      name: 'John Updated',
      skill_level: 'Advanced'
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('John Updated');
    expect(result!.bio).toEqual(initialUserData.bio); // Should remain unchanged
    expect(result!.skill_level).toEqual('Advanced');
    expect(result!.location).toEqual(initialUserData.location); // Should remain unchanged
  });

  it('should update bio to null', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update bio to null
    const updateInput: UpdateUserProfileInput = {
      id: userId,
      bio: null
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeDefined();
    expect(result!.bio).toBeNull();
    expect(result!.name).toEqual(initialUserData.name); // Should remain unchanged
  });

  it('should save updated profile to database', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update profile
    const updateInput: UpdateUserProfileInput = {
      id: userId,
      name: 'Database Test User',
      location: 'Chicago'
    };

    const result = await updateUserProfile(updateInput);

    // Verify in database
    const dbProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .execute();

    expect(dbProfile).toHaveLength(1);
    expect(dbProfile[0].name).toEqual('Database Test User');
    expect(dbProfile[0].location).toEqual('Chicago');
    expect(dbProfile[0].bio).toEqual(initialUserData.bio); // Should remain unchanged
    expect(dbProfile[0].skill_level).toEqual(initialUserData.skill_level); // Should remain unchanged
  });

  it('should return null when user does not exist', async () => {
    const updateInput: UpdateUserProfileInput = {
      id: 999, // Non-existent user ID
      name: 'Non-existent User'
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided for update', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update with no fields (only id)
    const updateInput: UpdateUserProfileInput = {
      id: userId
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeNull();
  });

  it('should handle all skill level values', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Test each skill level
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;

    for (const skillLevel of skillLevels) {
      const updateInput: UpdateUserProfileInput = {
        id: userId,
        skill_level: skillLevel
      };

      const result = await updateUserProfile(updateInput);

      expect(result).toBeDefined();
      expect(result!.skill_level).toEqual(skillLevel);
    }
  });

  it('should update timestamps correctly', async () => {
    // Create initial user profile
    const createResult = await db.insert(userProfilesTable)
      .values({
        ...initialUserData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();
    
    const userId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update profile
    const updateInput: UpdateUserProfileInput = {
      id: userId,
      name: 'Timestamp Test'
    };

    const result = await updateUserProfile(updateInput);

    expect(result).toBeDefined();
    expect(result!.created_at).toEqual(originalCreatedAt); // Should not change
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime()); // Should be updated
  });
});
