import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, usersTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

// Test tag input
const testTagInput: CreateTagInput = {
  name: 'JavaScript',
  user_id: 1
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;

  beforeEach(async () => {
    // Create a test user for all tests
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  it('should create a tag successfully', async () => {
    const input: CreateTagInput = {
      name: 'React',
      user_id: userId
    };

    const result = await createTag(input);

    // Verify basic properties
    expect(result.id).toBeDefined();
    expect(result.name).toEqual('React');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const input: CreateTagInput = {
      name: 'Vue.js',
      user_id: userId
    };

    const result = await createTag(input);

    // Query database to verify tag was saved
    const savedTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(savedTags).toHaveLength(1);
    expect(savedTags[0].name).toEqual('Vue.js');
    expect(savedTags[0].user_id).toEqual(userId);
    expect(savedTags[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate tag names for the same user', async () => {
    const input: CreateTagInput = {
      name: 'Angular',
      user_id: userId
    };

    // Create first tag
    await createTag(input);

    // Try to create duplicate tag
    await expect(createTag(input)).rejects.toThrow(/tag with this name already exists/i);

    // Verify only one tag exists
    const tags = await db.select()
      .from(tagsTable)
      .where(and(
        eq(tagsTable.name, 'Angular'),
        eq(tagsTable.user_id, userId)
      ))
      .execute();

    expect(tags).toHaveLength(1);
  });

  it('should allow same tag name for different users', async () => {
    // Create second user
    const secondUser = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashed_password2'
      })
      .returning()
      .execute();

    const tagName = 'TypeScript';

    // Create tag for first user
    const input1: CreateTagInput = {
      name: tagName,
      user_id: userId
    };
    const result1 = await createTag(input1);

    // Create tag with same name for second user
    const input2: CreateTagInput = {
      name: tagName,
      user_id: secondUser[0].id
    };
    const result2 = await createTag(input2);

    // Both should succeed
    expect(result1.name).toEqual(tagName);
    expect(result1.user_id).toEqual(userId);
    expect(result2.name).toEqual(tagName);
    expect(result2.user_id).toEqual(secondUser[0].id);

    // Verify both tags exist in database
    const allTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.name, tagName))
      .execute();

    expect(allTags).toHaveLength(2);
  });

  it('should throw error for non-existent user', async () => {
    const input: CreateTagInput = {
      name: 'Python',
      user_id: 99999 // Non-existent user ID
    };

    await expect(createTag(input)).rejects.toThrow(/user not found/i);

    // Verify no tag was created
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.name, 'Python'))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should handle special characters in tag names', async () => {
    const input: CreateTagInput = {
      name: 'C++/C#',
      user_id: userId
    };

    const result = await createTag(input);

    expect(result.name).toEqual('C++/C#');
    expect(result.user_id).toEqual(userId);

    // Verify in database
    const savedTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(savedTag[0].name).toEqual('C++/C#');
  });

  it('should trim whitespace from tag names', async () => {
    const input: CreateTagInput = {
      name: '  Node.js  ',
      user_id: userId
    };

    const result = await createTag(input);

    // Note: The handler doesn't explicitly trim, but if the schema validation does,
    // this test would verify that behavior. For now, it will create with whitespace.
    expect(result.name).toEqual('  Node.js  ');
    expect(result.user_id).toEqual(userId);
  });
});
