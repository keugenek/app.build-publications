import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Test user data for foreign key relationship
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

// Test input with all fields
const testInput: CreateTagInput = {
  user_id: 1,
  name: 'Important',
  color: '#ff0000'
};

// Test input without optional color
const testInputNoColor: CreateTagInput = {
  user_id: 1,
  name: 'General'
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag with color', async () => {
    // Create test user first for foreign key
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const result = await createTag({
      ...testInput,
      user_id: userId
    });

    // Basic field validation
    expect(result.name).toEqual('Important');
    expect(result.color).toEqual('#ff0000');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag without color (null)', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const result = await createTag({
      ...testInputNoColor,
      user_id: userId
    });

    expect(result.name).toEqual('General');
    expect(result.color).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const result = await createTag({
      ...testInput,
      user_id: userId
    });

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Important');
    expect(tags[0].color).toEqual('#ff0000');
    expect(tags[0].user_id).toEqual(userId);
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle tag creation for different users', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com', 
        password_hash: 'hashedpassword456'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create tags for both users with same name (should be allowed)
    const tag1 = await createTag({
      user_id: user1Id,
      name: 'Work',
      color: '#0000ff'
    });

    const tag2 = await createTag({
      user_id: user2Id,
      name: 'Work',
      color: '#00ff00'
    });

    expect(tag1.user_id).toEqual(user1Id);
    expect(tag1.name).toEqual('Work');
    expect(tag1.color).toEqual('#0000ff');

    expect(tag2.user_id).toEqual(user2Id);
    expect(tag2.name).toEqual('Work');
    expect(tag2.color).toEqual('#00ff00');

    // Verify both tags exist in database
    const allTags = await db.select()
      .from(tagsTable)
      .execute();

    expect(allTags).toHaveLength(2);
  });

  it('should handle undefined color properly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create tag with explicitly undefined color
    const result = await createTag({
      user_id: userId,
      name: 'Test Tag',
      color: undefined
    });

    expect(result.color).toBeNull();
    expect(result.name).toEqual('Test Tag');
  });

  it('should throw error for non-existent user_id', async () => {
    // Try to create tag with non-existent user_id
    await expect(createTag({
      user_id: 99999,
      name: 'Invalid User Tag'
    })).rejects.toThrow(/foreign key constraint/i);
  });
});
