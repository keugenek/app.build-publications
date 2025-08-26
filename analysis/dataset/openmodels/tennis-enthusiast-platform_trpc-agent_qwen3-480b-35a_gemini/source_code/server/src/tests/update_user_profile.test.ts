import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreateUserProfileInput, type UpdateUserProfileInput } from '../schema';
import { updateProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (input: CreateUserProfileInput) => {
  const result = await db.insert(playersTable)
    .values({
      name: input.name,
      email: `${input.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
      skill_level: input.skill_level,
      city: input.city
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user profile with all fields', async () => {
    // Create a test user first
    const testUser = await createTestUser({
      name: 'John Doe',
      skill_level: 'Beginner',
      city: 'New York'
    });

    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      name: 'Jane Smith',
      skill_level: 'Advanced',
      city: 'Los Angeles'
    };

    const result = await updateProfile(updateInput);

    // Validate the returned data
    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.skill_level).toEqual('Advanced');
    expect(result.city).toEqual('Los Angeles');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a user profile with partial fields', async () => {
    // Create a test user first
    const testUser = await createTestUser({
      name: 'John Doe',
      skill_level: 'Beginner',
      city: 'New York'
    });

    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      name: 'Jane Smith'
      // Only updating name, other fields should remain unchanged
    };

    const result = await updateProfile(updateInput);

    // Validate the returned data
    expect(result.id).toEqual(testUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.skill_level).toEqual('Beginner'); // Should remain unchanged
    expect(result.city).toEqual('New York'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated profile to database', async () => {
    // Create a test user first
    const testUser = await createTestUser({
      name: 'John Doe',
      skill_level: 'Beginner',
      city: 'New York'
    });

    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      skill_level: 'Intermediate',
      city: 'Boston'
    };

    const result = await updateProfile(updateInput);

    // Query the database to verify the update was saved
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].name).toEqual('John Doe'); // Should remain unchanged
    expect(players[0].skill_level).toEqual('Intermediate'); // Updated value
    expect(players[0].city).toEqual('Boston'); // Updated value
    expect(players[0].created_at).toBeInstanceOf(Date);
    expect(players[0].updated_at).toBeInstanceOf(Date);
    // updated_at should be more recent than created_at
    expect(players[0].updated_at.getTime()).toBeGreaterThanOrEqual(players[0].created_at.getTime());
  });

  it('should throw an error when trying to update a non-existent user', async () => {
    const updateInput: UpdateUserProfileInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent User'
    };

    await expect(updateProfile(updateInput)).rejects.toThrow(/No player found with id/);
  });
});
