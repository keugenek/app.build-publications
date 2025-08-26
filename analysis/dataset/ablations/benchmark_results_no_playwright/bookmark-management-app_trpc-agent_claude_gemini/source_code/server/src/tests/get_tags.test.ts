import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type GetUserEntityInput, type CreateUserInput, type CreateTagInput } from '../schema';
import { getTags } from '../handlers/get_tags';
// Helper function to create a user for testing
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      username: userData.username,
      email: userData.email,
      password_hash: 'hashed_password' // Simple placeholder for tests
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a tag for testing
const createTestTag = async (tagData: CreateTagInput) => {
  const result = await db.insert(tagsTable)
    .values({
      user_id: tagData.user_id,
      name: tagData.name,
      color: tagData.color || null
    })
    .returning()
    .execute();
  return result[0];
};

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password123'
};

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no tags', async () => {
    const user = await createTestUser(testUser);
    const input: GetUserEntityInput = { user_id: user.id };

    const result = await getTags(input);

    expect(result).toEqual([]);
  });

  it('should return all tags for a user', async () => {
    const user = await createTestUser(testUser);
    
    // Create test tags
    const tag1Data: CreateTagInput = {
      user_id: user.id,
      name: 'Work',
      color: '#ff0000'
    };
    
    const tag2Data: CreateTagInput = {
      user_id: user.id,
      name: 'Personal',
      color: '#00ff00'
    };

    const tag1 = await createTestTag(tag1Data);
    const tag2 = await createTestTag(tag2Data);

    const input: GetUserEntityInput = { user_id: user.id };
    const result = await getTags(input);

    expect(result).toHaveLength(2);
    
    // Sort results by id for consistent comparison
    const sortedResult = result.sort((a, b) => a.id - b.id);
    
    expect(sortedResult[0].id).toEqual(tag1.id);
    expect(sortedResult[0].user_id).toEqual(user.id);
    expect(sortedResult[0].name).toEqual('Work');
    expect(sortedResult[0].color).toEqual('#ff0000');
    expect(sortedResult[0].created_at).toBeInstanceOf(Date);

    expect(sortedResult[1].id).toEqual(tag2.id);
    expect(sortedResult[1].user_id).toEqual(user.id);
    expect(sortedResult[1].name).toEqual('Personal');
    expect(sortedResult[1].color).toEqual('#00ff00');
    expect(sortedResult[1].created_at).toBeInstanceOf(Date);
  });

  it('should return tags with null color correctly', async () => {
    const user = await createTestUser(testUser);
    
    const tagData: CreateTagInput = {
      user_id: user.id,
      name: 'No Color Tag'
    };

    await createTestTag(tagData);

    const input: GetUserEntityInput = { user_id: user.id };
    const result = await getTags(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('No Color Tag');
    expect(result[0].color).toBeNull();
  });

  it('should only return tags for the specified user', async () => {
    const user1 = await createTestUser(testUser);
    const user2 = await createTestUser(testUser2);
    
    // Create tags for both users
    const user1TagData: CreateTagInput = {
      user_id: user1.id,
      name: 'User1 Tag',
      color: '#ff0000'
    };
    
    const user2TagData: CreateTagInput = {
      user_id: user2.id,
      name: 'User2 Tag',
      color: '#00ff00'
    };

    await createTestTag(user1TagData);
    await createTestTag(user2TagData);

    // Get tags for user1
    const input1: GetUserEntityInput = { user_id: user1.id };
    const result1 = await getTags(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].user_id).toEqual(user1.id);
    expect(result1[0].name).toEqual('User1 Tag');

    // Get tags for user2
    const input2: GetUserEntityInput = { user_id: user2.id };
    const result2 = await getTags(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].user_id).toEqual(user2.id);
    expect(result2[0].name).toEqual('User2 Tag');
  });

  it('should handle multiple tags with same name for same user', async () => {
    const user = await createTestUser(testUser);
    
    // Create multiple tags with same name but different colors
    const tag1Data: CreateTagInput = {
      user_id: user.id,
      name: 'Duplicate',
      color: '#ff0000'
    };
    
    const tag2Data: CreateTagInput = {
      user_id: user.id,
      name: 'Duplicate',
      color: '#00ff00'
    };

    await createTestTag(tag1Data);
    await createTestTag(tag2Data);

    const input: GetUserEntityInput = { user_id: user.id };
    const result = await getTags(input);

    expect(result).toHaveLength(2);
    
    // Both tags should have same name but different colors
    const names = result.map(tag => tag.name);
    const colors = result.map(tag => tag.color);
    
    expect(names).toEqual(['Duplicate', 'Duplicate']);
    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#00ff00');
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserEntityInput = { user_id: 999999 };

    const result = await getTags(input);

    expect(result).toEqual([]);
  });
});
