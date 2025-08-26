import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

// Test user data
const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'Experienced developer looking to mentor others'
};

const testUserWithoutBio: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  skill_level: 'beginner',
  location: 'San Francisco'
  // bio is optional/undefined
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve existing user by id', async () => {
    // Create a test user first
    const insertResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Retrieve the user
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.skill_level).toEqual('intermediate');
    expect(result!.location).toEqual('New York');
    expect(result!.bio).toEqual('Experienced developer looking to mentor others');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle user with null bio', async () => {
    // Create a test user without bio
    const insertResult = await db.insert(usersTable)
      .values({
        name: testUserWithoutBio.name,
        email: testUserWithoutBio.email,
        skill_level: testUserWithoutBio.skill_level,
        location: testUserWithoutBio.location,
        bio: null
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Retrieve the user
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.email).toEqual('jane.smith@example.com');
    expect(result!.skill_level).toEqual('beginner');
    expect(result!.location).toEqual('San Francisco');
    expect(result!.bio).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    const result = await getUser(99999);
    expect(result).toBeNull();
  });

  it('should handle different skill levels correctly', async () => {
    // Test each skill level
    const skillLevels = ['beginner', 'intermediate', 'advanced'] as const;
    
    for (const skillLevel of skillLevels) {
      const insertResult = await db.insert(usersTable)
        .values({
          name: `User ${skillLevel}`,
          email: `${skillLevel}@example.com`,
          skill_level: skillLevel,
          location: 'Test City',
          bio: null
        })
        .returning()
        .execute();

      const createdUser = insertResult[0];
      const result = await getUser(createdUser.id);

      expect(result).not.toBeNull();
      expect(result!.skill_level).toEqual(skillLevel);
    }
  });

  it('should retrieve user with correct timestamp types', async () => {
    // Create a test user
    const insertResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        skill_level: testUser.skill_level,
        location: testUser.location,
        bio: testUser.bio
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Retrieve the user
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result!.created_at >= oneMinuteAgo).toBe(true);
    expect(result!.created_at <= now).toBe(true);
    expect(result!.updated_at >= oneMinuteAgo).toBe(true);
    expect(result!.updated_at <= now).toBe(true);
  });
});
