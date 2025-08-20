import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createUserProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Test input for a tennis player profile
const testInput: CreateUserProfileInput = {
  name: 'John Tennis',
  skill_level: 'Intermediate',
  city: 'Austin',
  state: 'Texas',
  bio: 'Looking for tennis partners in Austin! I love playing on weekends.'
};

describe('createUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile', async () => {
    const result = await createUserProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Tennis');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.city).toEqual('Austin');
    expect(result.state).toEqual('Texas');
    expect(result.bio).toEqual('Looking for tennis partners in Austin! I love playing on weekends.');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user profile to database', async () => {
    const result = await createUserProfile(testInput);

    // Query using proper drizzle syntax
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('John Tennis');
    expect(profiles[0].skill_level).toEqual('Intermediate');
    expect(profiles[0].city).toEqual('Austin');
    expect(profiles[0].state).toEqual('Texas');
    expect(profiles[0].bio).toEqual('Looking for tennis partners in Austin! I love playing on weekends.');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different skill levels correctly', async () => {
    const beginnerInput: CreateUserProfileInput = {
      name: 'Jane Beginner',
      skill_level: 'Beginner',
      city: 'Houston',
      state: 'Texas',
      bio: 'New to tennis, excited to learn!'
    };

    const result = await createUserProfile(beginnerInput);

    expect(result.skill_level).toEqual('Beginner');
    expect(result.name).toEqual('Jane Beginner');
  });

  it('should handle advanced skill level correctly', async () => {
    const advancedInput: CreateUserProfileInput = {
      name: 'Mike Advanced',
      skill_level: 'Advanced',
      city: 'Dallas',
      state: 'Texas',
      bio: 'Competitive tennis player looking for challenging matches.'
    };

    const result = await createUserProfile(advancedInput);

    expect(result.skill_level).toEqual('Advanced');
    expect(result.name).toEqual('Mike Advanced');
  });

  it('should handle long bio text within limit', async () => {
    const longBioInput: CreateUserProfileInput = {
      name: 'Sarah Writer',
      skill_level: 'Intermediate',
      city: 'San Antonio',
      state: 'Texas',
      bio: 'I have been playing tennis for over 10 years and absolutely love the sport. I prefer playing doubles matches and enjoy meeting new people through tennis. I usually play on weekday evenings and weekend mornings. My favorite surface is hard court but I also enjoy clay court matches when available.'
    };

    const result = await createUserProfile(longBioInput);

    expect(result.bio).toEqual(longBioInput.bio);
    expect(result.bio.length).toBeLessThanOrEqual(500); // Respects the schema validation
  });

  it('should create multiple user profiles with unique IDs', async () => {
    const input1: CreateUserProfileInput = {
      name: 'Player One',
      skill_level: 'Beginner',
      city: 'Austin',
      state: 'Texas',
      bio: 'First player'
    };

    const input2: CreateUserProfileInput = {
      name: 'Player Two',
      skill_level: 'Advanced',
      city: 'Houston',
      state: 'Texas',
      bio: 'Second player'
    };

    const result1 = await createUserProfile(input1);
    const result2 = await createUserProfile(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Player One');
    expect(result2.name).toEqual('Player Two');
    expect(typeof result1.id).toBe('number');
    expect(typeof result2.id).toBe('number');
  });

  it('should handle different states correctly', async () => {
    const californiaInput: CreateUserProfileInput = {
      name: 'West Coast Player',
      skill_level: 'Intermediate',
      city: 'Los Angeles',
      state: 'California',
      bio: 'Tennis player from the west coast'
    };

    const result = await createUserProfile(californiaInput);

    expect(result.state).toEqual('California');
    expect(result.city).toEqual('Los Angeles');
  });
});
