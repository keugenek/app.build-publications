import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserProfileInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'A passionate tennis player'
};

describe('createProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile', async () => {
    const result = await createProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.skill_level).toEqual('intermediate');
    expect(result.location).toEqual('New York');
    expect(result.bio).toEqual('A passionate tennis player');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user profile to database', async () => {
    const result = await createProfile(testInput);

    // Query using proper drizzle syntax
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('John Doe');
    expect(profiles[0].email).toEqual('john.doe@example.com');
    expect(profiles[0].skill_level).toEqual('intermediate');
    expect(profiles[0].location).toEqual('New York');
    expect(profiles[0].bio).toEqual('A passionate tennis player');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle profile creation with null bio', async () => {
    const inputWithoutBio: CreateUserProfileInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      skill_level: 'beginner',
      location: 'Los Angeles',
      bio: null
    };

    const result = await createProfile(inputWithoutBio);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.skill_level).toEqual('beginner');
    expect(result.location).toEqual('Los Angeles');
    expect(result.bio).toBeNull();
  });
});
