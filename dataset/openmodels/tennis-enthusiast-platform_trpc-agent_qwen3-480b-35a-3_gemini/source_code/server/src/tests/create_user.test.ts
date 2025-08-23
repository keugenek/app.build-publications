import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserInput = {
  name: 'John Doe',
  skill_level: 'Intermediate',
  location: 'New York'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.location).toEqual('New York');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].skill_level).toEqual('Intermediate');
    expect(users[0].location).toEqual('New York');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create users with different skill levels', async () => {
    const beginnerInput: CreateUserInput = {
      name: 'Beginner User',
      skill_level: 'Beginner',
      location: 'Boston'
    };

    const advancedInput: CreateUserInput = {
      name: 'Advanced User',
      skill_level: 'Advanced',
      location: 'San Francisco'
    };

    const beginnerResult = await createUser(beginnerInput);
    const advancedResult = await createUser(advancedInput);

    expect(beginnerResult.skill_level).toEqual('Beginner');
    expect(advancedResult.skill_level).toEqual('Advanced');
  });
});
