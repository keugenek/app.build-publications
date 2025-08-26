import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateTagInput = {
  user_id: 1,
  name: 'Test Tag'
};

describe('createTag', () => {
  beforeEach(async () => {
    await createDB();
    // Create a user first since tags reference users
    await db.insert(usersTable).values({
      id: 1,
      email: 'test@example.com',
      name: 'Test User'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should create a tag', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.user_id).toEqual(1);
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
    expect(tags[0].user_id).toEqual(1);
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail when user does not exist', async () => {
    const invalidInput: CreateTagInput = {
      user_id: 999, // Non-existent user
      name: 'Invalid Tag'
    };

    await expect(createTag(invalidInput)).rejects.toThrow(/User with id 999 does not exist/);
  });

  it('should create multiple tags for the same user', async () => {
    const tag1 = await createTag({
      user_id: 1,
      name: 'First Tag'
    });

    const tag2 = await createTag({
      user_id: 1,
      name: 'Second Tag'
    });

    expect(tag1.id).not.toBe(tag2.id);
    expect(tag1.user_id).toBe(tag2.user_id);
    expect(tag1.name).toEqual('First Tag');
    expect(tag2.name).toEqual('Second Tag');
  });
});
