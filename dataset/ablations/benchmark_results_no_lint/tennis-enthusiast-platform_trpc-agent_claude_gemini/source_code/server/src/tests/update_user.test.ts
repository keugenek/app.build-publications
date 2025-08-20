import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test user for creating initial record
const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com',
  skill_level: 'beginner',
  location: 'San Francisco',
  bio: 'Original bio'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all provided fields', async () => {
    // Create a user first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio || null
      })
      .returning()
      .execute();

    const createdUser = createResult[0];
    const originalUpdatedAt = createdUser.updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Jane Smith',
      skill_level: 'advanced',
      location: 'New York',
      bio: 'Updated bio'
    };

    const result = await updateUser(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual(testUser.email); // Should remain unchanged
    expect(result.skill_level).toEqual('advanced');
    expect(result.location).toEqual('New York');
    expect(result.bio).toEqual('Updated bio');
    expect(result.created_at).toEqual(createdUser.created_at); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update only provided fields', async () => {
    // Create a user first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio || null
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Update only name and location
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Name',
      location: 'Updated Location'
    };

    const result = await updateUser(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Updated Name');
    expect(result.location).toEqual('Updated Location');
    expect(result.skill_level).toEqual(testUser.skill_level); // Should remain unchanged
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.email).toEqual(testUser.email); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
  });

  it('should handle bio set to null', async () => {
    // Create a user with bio first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: 'Some bio content'
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Update bio to null
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      bio: null
    };

    const result = await updateUser(updateInput);

    expect(result.bio).toBeNull();
    expect(result.name).toEqual(testUser.name); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update record in database', async () => {
    // Create a user first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio || null
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Database Updated Name',
      skill_level: 'intermediate'
    };

    await updateUser(updateInput);

    // Verify the database was updated
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    expect(updatedUsers[0].name).toEqual('Database Updated Name');
    expect(updatedUsers[0].skill_level).toEqual('intermediate');
    expect(updatedUsers[0].location).toEqual(testUser.location); // Should remain unchanged
    expect(updatedUsers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent user ID
      name: 'New Name'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should update user with minimal input (only id)', async () => {
    // Create a user first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio || null
      })
      .returning()
      .execute();

    const createdUser = createResult[0];
    const originalUpdatedAt = createdUser.updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only ID (should only update timestamp)
    const updateInput: UpdateUserInput = {
      id: createdUser.id
    };

    const result = await updateUser(updateInput);

    // All fields except updated_at should remain the same
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual(testUser.name);
    expect(result.email).toEqual(testUser.email);
    expect(result.skill_level).toEqual(testUser.skill_level);
    expect(result.location).toEqual(testUser.location);
    expect(result.bio).toEqual('Original bio');
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle all skill levels', async () => {
    // Create a user first
    const createResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: 'beginner',
        location: testUser.location,
        bio: testUser.bio || null
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test each skill level
    const skillLevels = ['beginner', 'intermediate', 'advanced'] as const;

    for (const skillLevel of skillLevels) {
      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        skill_level: skillLevel
      };

      const result = await updateUser(updateInput);
      expect(result.skill_level).toEqual(skillLevel);
    }
  });
});
