import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no tags', async () => {
    // Create a user first
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getTags(userId);

    expect(result).toEqual([]);
  });

  it('should return all tags for a user', async () => {
    // Create a user first
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create multiple tags for the user
    const tags = await db.insert(tagsTable)
      .values([
        {
          name: 'JavaScript',
          user_id: userId
        },
        {
          name: 'TypeScript',
          user_id: userId
        },
        {
          name: 'React',
          user_id: userId
        }
      ])
      .returning()
      .execute();

    const result = await getTags(userId);

    expect(result).toHaveLength(3);
    
    // Verify tag properties
    const tagNames = result.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'React', 'TypeScript']);
    
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(tag.user_id).toEqual(userId);
      expect(tag.created_at).toBeInstanceOf(Date);
      expect(typeof tag.name).toBe('string');
    });
  });

  it('should only return tags for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashedpassword1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashedpassword2'
        }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create tags for both users
    await db.insert(tagsTable)
      .values([
        {
          name: 'User1Tag1',
          user_id: user1Id
        },
        {
          name: 'User1Tag2',
          user_id: user1Id
        },
        {
          name: 'User2Tag1',
          user_id: user2Id
        },
        {
          name: 'User2Tag2',
          user_id: user2Id
        }
      ])
      .execute();

    // Get tags for user1
    const user1Tags = await getTags(user1Id);
    expect(user1Tags).toHaveLength(2);
    user1Tags.forEach(tag => {
      expect(tag.user_id).toEqual(user1Id);
      expect(tag.name).toMatch(/^User1Tag/);
    });

    // Get tags for user2
    const user2Tags = await getTags(user2Id);
    expect(user2Tags).toHaveLength(2);
    user2Tags.forEach(tag => {
      expect(tag.user_id).toEqual(user2Id);
      expect(tag.name).toMatch(/^User2Tag/);
    });
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 99999;
    
    const result = await getTags(nonExistentUserId);
    
    expect(result).toEqual([]);
  });

  it('should return tags in creation order', async () => {
    // Create a user first
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create tags with slight delay to ensure different timestamps
    const tag1 = await db.insert(tagsTable)
      .values({
        name: 'First Tag',
        user_id: userId
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const tag2 = await db.insert(tagsTable)
      .values({
        name: 'Second Tag',
        user_id: userId
      })
      .returning()
      .execute();

    const result = await getTags(userId);

    expect(result).toHaveLength(2);
    // First tag should come first (earlier created_at)
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
