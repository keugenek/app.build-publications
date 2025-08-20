import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { getAllUsers } from '../handlers/get_all_users';

// Test user data
const testUsers: CreateUserProfileInput[] = [
  {
    name: 'Alice Johnson',
    bio: 'Tennis enthusiast from downtown',
    skill_level: 'Beginner',
    location: 'New York'
  },
  {
    name: 'Bob Smith',
    bio: null,
    skill_level: 'Intermediate',
    location: 'Los Angeles'
  },
  {
    name: 'Carol Davis',
    bio: 'Advanced player, loves doubles',
    skill_level: 'Advanced',
    location: 'Chicago'
  }
];

describe('getAllUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getAllUsers();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users when users exist', async () => {
    // Create test users
    await db.insert(userProfilesTable)
      .values(testUsers)
      .execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Verify all users are returned
    const names = result.map(user => user.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Bob Smith', 'Carol Davis']);
  });

  it('should return users with all required fields', async () => {
    // Create a single test user
    await db.insert(userProfilesTable)
      .values([testUsers[0]])
      .execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify all fields exist and have correct types
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe('number');
    expect(user.name).toBe('Alice Johnson');
    expect(user.bio).toBe('Tennis enthusiast from downtown');
    expect(user.skill_level).toBe('Beginner');
    expect(user.location).toBe('New York');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should handle users with null bio fields', async () => {
    // Create user with null bio
    await db.insert(userProfilesTable)
      .values([testUsers[1]]) // Bob Smith has null bio
      .execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(user.name).toBe('Bob Smith');
    expect(user.bio).toBeNull();
    expect(user.skill_level).toBe('Intermediate');
    expect(user.location).toBe('Los Angeles');
  });

  it('should return users with different skill levels', async () => {
    // Create all test users
    await db.insert(userProfilesTable)
      .values(testUsers)
      .execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(3);

    // Verify skill levels are preserved
    const skillLevels = result.map(user => user.skill_level).sort();
    expect(skillLevels).toEqual(['Advanced', 'Beginner', 'Intermediate']);
  });

  it('should return users in database insertion order', async () => {
    // Insert users one by one to verify order
    for (const userData of testUsers) {
      await db.insert(userProfilesTable)
        .values([userData])
        .execute();
    }

    const result = await getAllUsers();

    expect(result).toHaveLength(3);

    // Verify insertion order (first inserted should have lowest ID)
    const sortedByIdAsc = [...result].sort((a, b) => a.id - b.id);
    expect(result[0].id).toBe(sortedByIdAsc[0].id);
    expect(result[0].name).toBe('Alice Johnson');
    expect(result[1].name).toBe('Bob Smith');
    expect(result[2].name).toBe('Carol Davis');
  });

  it('should handle timestamps correctly', async () => {
    const beforeInsert = new Date();
    
    await db.insert(userProfilesTable)
      .values([testUsers[0]])
      .execute();
    
    const afterInsert = new Date();
    const result = await getAllUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
    expect(user.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(user.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    expect(user.updated_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(user.updated_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});
