import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { getUserTags } from '../handlers/get_user_tags';

describe('getUserTags', () => {
  let testUserId1: number;
  let testUserId2: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1'
        },
        {
          email: 'user2@example.com',
          username: 'user2'
        }
      ])
      .returning()
      .execute();

    testUserId1 = users[0].id;
    testUserId2 = users[1].id;
  });

  afterEach(resetDB);

  it('should return empty array for user with no tags', async () => {
    const result = await getUserTags(testUserId1);
    
    expect(result).toEqual([]);
  });

  it('should return tags for specific user', async () => {
    // Create tags for user1
    await db.insert(tagsTable)
      .values([
        {
          name: 'work',
          color: '#FF0000',
          user_id: testUserId1
        },
        {
          name: 'personal',
          color: '#00FF00',
          user_id: testUserId1
        }
      ])
      .execute();

    // Create tag for user2 (should not be returned)
    await db.insert(tagsTable)
      .values({
        name: 'other',
        color: '#0000FF',
        user_id: testUserId2
      })
      .execute();

    const result = await getUserTags(testUserId1);

    expect(result).toHaveLength(2);
    expect(result.map(tag => tag.name)).toEqual(['personal', 'work']); // Alphabetical order
    expect(result[0].user_id).toEqual(testUserId1);
    expect(result[1].user_id).toEqual(testUserId1);
  });

  it('should return tags ordered alphabetically by name', async () => {
    // Create tags in non-alphabetical order
    await db.insert(tagsTable)
      .values([
        {
          name: 'zebra',
          color: '#FF0000',
          user_id: testUserId1
        },
        {
          name: 'alpha',
          color: '#00FF00',
          user_id: testUserId1
        },
        {
          name: 'beta',
          color: '#0000FF',
          user_id: testUserId1
        }
      ])
      .execute();

    const result = await getUserTags(testUserId1);

    expect(result).toHaveLength(3);
    expect(result.map(tag => tag.name)).toEqual(['alpha', 'beta', 'zebra']);
  });

  it('should handle tags with null color', async () => {
    await db.insert(tagsTable)
      .values({
        name: 'uncolored',
        color: null,
        user_id: testUserId1
      })
      .execute();

    const result = await getUserTags(testUserId1);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('uncolored');
    expect(result[0].color).toBeNull();
    expect(result[0].user_id).toEqual(testUserId1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return all required tag fields', async () => {
    await db.insert(tagsTable)
      .values({
        name: 'complete-tag',
        color: '#FFFFFF',
        user_id: testUserId1
      })
      .execute();

    const result = await getUserTags(testUserId1);

    expect(result).toHaveLength(1);
    const tag = result[0];
    
    expect(tag.id).toBeDefined();
    expect(typeof tag.id).toBe('number');
    expect(tag.name).toEqual('complete-tag');
    expect(tag.color).toEqual('#FFFFFF');
    expect(tag.user_id).toEqual(testUserId1);
    expect(tag.created_at).toBeInstanceOf(Date);
  });

  it('should not return tags from different users', async () => {
    // Create tags for both users
    await db.insert(tagsTable)
      .values([
        {
          name: 'user1-tag',
          color: '#FF0000',
          user_id: testUserId1
        },
        {
          name: 'user2-tag',
          color: '#00FF00',
          user_id: testUserId2
        }
      ])
      .execute();

    const user1Tags = await getUserTags(testUserId1);
    const user2Tags = await getUserTags(testUserId2);

    expect(user1Tags).toHaveLength(1);
    expect(user1Tags[0].name).toEqual('user1-tag');
    expect(user1Tags[0].user_id).toEqual(testUserId1);

    expect(user2Tags).toHaveLength(1);
    expect(user2Tags[0].name).toEqual('user2-tag');
    expect(user2Tags[0].user_id).toEqual(testUserId2);
  });
});
