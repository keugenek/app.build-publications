import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createUserProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Test input for creating a tennis player profile
const testInput: CreateUserProfileInput = {
  name: 'Alex Johnson',
  skill_level: 'Intermediate',
  location: 'Austin, TX'
};

describe('createUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile', async () => {
    const result = await createUserProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('Alex Johnson');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.location).toEqual('Austin, TX');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user profile to database', async () => {
    const result = await createUserProfile(testInput);

    // Query using proper drizzle syntax
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('Alex Johnson');
    expect(profiles[0].skill_level).toEqual('Intermediate');
    expect(profiles[0].location).toEqual('Austin, TX');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple distinct user profiles', async () => {
    const input1: CreateUserProfileInput = {
      name: 'Sarah Williams',
      skill_level: 'Advanced',
      location: 'Dallas, TX'
    };

    const input2: CreateUserProfileInput = {
      name: 'Mike Chen',
      skill_level: 'Beginner',
      location: 'Houston, TX'
    };

    const result1 = await createUserProfile(input1);
    const result2 = await createUserProfile(input2);

    // Verify both profiles are created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Sarah Williams');
    expect(result2.name).toEqual('Mike Chen');
    expect(result1.skill_level).toEqual('Advanced');
    expect(result2.skill_level).toEqual('Beginner');
    expect(result1.location).toEqual('Dallas, TX');
    expect(result2.location).toEqual('Houston, TX');

    // Verify both are in the database
    const allProfiles = await db.select()
      .from(userProfilesTable)
      .execute();

    expect(allProfiles).toHaveLength(2);
  });

  it('should handle edge case inputs correctly', async () => {
    const edgeCaseInput: CreateUserProfileInput = {
      name: 'A', // Minimum length
      skill_level: 'Professional - ATP Tour Level with 20+ years experience',
      location: 'New York, NY'
    };

    const result = await createUserProfile(edgeCaseInput);

    expect(result.name).toEqual('A');
    expect(result.skill_level).toEqual('Professional - ATP Tour Level with 20+ years experience');
    expect(result.location).toEqual('New York, NY');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createUserProfile(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Initially, created_at and updated_at should be the same
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });
});
