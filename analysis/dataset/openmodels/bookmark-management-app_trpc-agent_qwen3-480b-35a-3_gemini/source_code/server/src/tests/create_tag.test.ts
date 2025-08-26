import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_here',
};

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag',
};

describe('createTag', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test user first
    await db.insert(usersTable).values(testUser).execute();
  });
  
  afterEach(resetDB);

  it('should create a tag', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.user_id).toEqual(1); // Default user ID used in handler
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].user_id).toEqual(1); // Default user ID used in handler
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });
});
