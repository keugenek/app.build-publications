import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, usersTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq, and } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  username: 'testuser'
};

const testTagInput: CreateTagInput = {
  name: 'Work',
  color: '#FF0000',
  user_id: 1 // Will be set after user creation
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag successfully', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const tagInput = { ...testTagInput, user_id: userId };

    const result = await createTag(tagInput);

    // Verify returned tag
    expect(result.id).toBeDefined();
    expect(result.name).toEqual('Work');
    expect(result.color).toEqual('#FF0000');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const tagInput = { ...testTagInput, user_id: userId };

    const result = await createTag(tagInput);

    // Query database to verify tag was saved
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Work');
    expect(tags[0].color).toEqual('#FF0000');
    expect(tags[0].user_id).toEqual(userId);
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should create tag with null color', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const tagInput: CreateTagInput = {
      name: 'Personal',
      color: null,
      user_id: userId
    };

    const result = await createTag(tagInput);

    expect(result.name).toEqual('Personal');
    expect(result.color).toBeNull();
    expect(result.user_id).toEqual(userId);
  });

  it('should throw error if user does not exist', async () => {
    const tagInput: CreateTagInput = {
      name: 'Work',
      color: '#FF0000',
      user_id: 999 // Non-existent user ID
    };

    await expect(createTag(tagInput)).rejects.toThrow(/User with ID 999 does not exist/i);
  });

  it('should throw error if tag name already exists for user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create first tag
    await db.insert(tagsTable)
      .values({
        name: 'Work',
        color: '#FF0000',
        user_id: userId
      })
      .execute();

    // Try to create duplicate tag
    const duplicateTagInput: CreateTagInput = {
      name: 'Work',
      color: '#00FF00',
      user_id: userId
    };

    await expect(createTag(duplicateTagInput)).rejects.toThrow(/Tag with name "Work" already exists for this user/i);
  });

  it('should allow same tag name for different users', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({ email: 'user1@example.com', username: 'user1' })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({ email: 'user2@example.com', username: 'user2' })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create tag for first user
    const tag1Input: CreateTagInput = {
      name: 'Work',
      color: '#FF0000',
      user_id: user1Id
    };

    const result1 = await createTag(tag1Input);

    // Create tag with same name for second user - should succeed
    const tag2Input: CreateTagInput = {
      name: 'Work',
      color: '#00FF00',
      user_id: user2Id
    };

    const result2 = await createTag(tag2Input);

    expect(result1.name).toEqual('Work');
    expect(result1.user_id).toEqual(user1Id);
    expect(result2.name).toEqual('Work');
    expect(result2.user_id).toEqual(user2Id);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle case-sensitive tag names correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create first tag with lowercase
    const tag1Input: CreateTagInput = {
      name: 'work',
      color: '#FF0000',
      user_id: userId
    };

    await createTag(tag1Input);

    // Try to create tag with different case - should succeed (case-sensitive)
    const tag2Input: CreateTagInput = {
      name: 'Work',
      color: '#00FF00',
      user_id: userId
    };

    const result = await createTag(tag2Input);

    expect(result.name).toEqual('Work');

    // Verify both tags exist in database
    const allTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    expect(allTags).toHaveLength(2);
    expect(allTags.map(t => t.name).sort()).toEqual(['Work', 'work']);
  });
});
