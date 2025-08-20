import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  display_name: 'Test User'
};

describe('createTag', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a tag with all fields', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Important',
      color: '#ff0000'
    };

    const result = await createTag(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userId);
    expect(result.name).toEqual('Important');
    expect(result.color).toEqual('#ff0000');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag without color (null color)', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Work',
      color: null
    };

    const result = await createTag(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userId);
    expect(result.name).toEqual('Work');
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag with undefined color (defaults to null)', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Personal'
      // color is undefined
    };

    const result = await createTag(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userId);
    expect(result.name).toEqual('Personal');
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database correctly', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Tech',
      color: '#00ff00'
    };

    const result = await createTag(input);

    // Query the database to verify the tag was saved
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].user_id).toEqual(userId);
    expect(tags[0].name).toEqual('Tech');
    expect(tags[0].color).toEqual('#00ff00');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input: CreateTagInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Test Tag',
      color: '#000000'
    };

    await expect(createTag(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error when tag name already exists for the same user', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Duplicate',
      color: '#ff0000'
    };

    // Create the first tag
    await createTag(input);

    // Attempt to create a duplicate tag with the same name
    await expect(createTag(input)).rejects.toThrow(/Tag with name 'Duplicate' already exists/i);
  });

  it('should allow same tag name for different users', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password_456',
        display_name: 'Second User'
      })
      .returning()
      .execute();
    const secondUserId = secondUserResult[0].id;

    const tagName = 'Shared Name';

    // Create tag for first user
    const firstTag = await createTag({
      user_id: userId,
      name: tagName,
      color: '#ff0000'
    });

    // Create tag with same name for second user - should succeed
    const secondTag = await createTag({
      user_id: secondUserId,
      name: tagName,
      color: '#00ff00'
    });

    expect(firstTag.name).toEqual(tagName);
    expect(secondTag.name).toEqual(tagName);
    expect(firstTag.user_id).toEqual(userId);
    expect(secondTag.user_id).toEqual(secondUserId);
    expect(firstTag.id).not.toEqual(secondTag.id);
  });

  it('should handle case-sensitive tag names correctly', async () => {
    // Create tag with lowercase name
    const firstTag = await createTag({
      user_id: userId,
      name: 'work',
      color: '#ff0000'
    });

    // Create tag with uppercase name - should succeed (case sensitive)
    const secondTag = await createTag({
      user_id: userId,
      name: 'WORK',
      color: '#00ff00'
    });

    expect(firstTag.name).toEqual('work');
    expect(secondTag.name).toEqual('WORK');
    expect(firstTag.id).not.toEqual(secondTag.id);
  });

  it('should validate that tag names are unique per user using database query', async () => {
    const input: CreateTagInput = {
      user_id: userId,
      name: 'Database Test',
      color: '#blue'
    };

    await createTag(input);

    // Query database to confirm tag exists
    const existingTags = await db.select()
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.user_id, userId),
          eq(tagsTable.name, 'Database Test')
        )
      )
      .execute();

    expect(existingTags).toHaveLength(1);
    expect(existingTags[0].name).toEqual('Database Test');
    expect(existingTags[0].user_id).toEqual(userId);
  });
});
