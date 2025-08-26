import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  skill_level: 'intermediate',
  location: 'San Francisco, CA',
  bio: 'A passionate developer'
};

// Test input without optional bio
const testInputNoBio: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  skill_level: 'advanced',
  location: 'New York, NY'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.skill_level).toEqual('intermediate');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.bio).toEqual('A passionate developer');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user without bio field', async () => {
    const result = await createUser(testInputNoBio);

    // Verify bio is null when not provided
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.skill_level).toEqual('advanced');
    expect(result.location).toEqual('New York, NY');
    expect(result.bio).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].skill_level).toEqual('intermediate');
    expect(users[0].location).toEqual('San Francisco, CA');
    expect(users[0].bio).toEqual('A passionate developer');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create another user with same email
    const duplicateInput: CreateUserInput = {
      name: 'Different Name',
      email: 'john.doe@example.com', // Same email as first user
      skill_level: 'beginner',
      location: 'Los Angeles, CA'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different skill levels correctly', async () => {
    const beginnerInput: CreateUserInput = {
      name: 'Beginner User',
      email: 'beginner@example.com',
      skill_level: 'beginner',
      location: 'Austin, TX'
    };

    const advancedInput: CreateUserInput = {
      name: 'Advanced User',
      email: 'advanced@example.com',
      skill_level: 'advanced',
      location: 'Seattle, WA'
    };

    const beginnerResult = await createUser(beginnerInput);
    const advancedResult = await createUser(advancedInput);

    expect(beginnerResult.skill_level).toEqual('beginner');
    expect(advancedResult.skill_level).toEqual('advanced');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
    
    const skillLevels = allUsers.map(user => user.skill_level).sort();
    expect(skillLevels).toEqual(['advanced', 'beginner']);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable bounds
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);

    // In most cases, created_at and updated_at should be very close or equal
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});
