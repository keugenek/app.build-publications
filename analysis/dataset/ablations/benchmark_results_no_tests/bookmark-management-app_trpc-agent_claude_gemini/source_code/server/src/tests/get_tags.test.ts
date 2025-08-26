import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';
import { eq } from 'drizzle-orm';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tags ordered alphabetically by name', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create tags in non-alphabetical order to test sorting
    await db.insert(tagsTable)
      .values([
        {
          user_id: userId,
          name: 'zebra',
          color: '#000000'
        },
        {
          user_id: userId,
          name: 'apple',
          color: '#ff0000'
        },
        {
          user_id: userId,
          name: 'banana',
          color: '#ffff00'
        }
      ])
      .execute();

    const result = await getTags(userId);

    // Verify alphabetical ordering
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('apple');
    expect(result[1].name).toBe('banana');
    expect(result[2].name).toBe('zebra');

    // Verify all fields are present
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(tag.user_id).toBe(userId);
      expect(tag.name).toBeDefined();
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when user has no tags', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const result = await getTags(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return tags belonging to specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User 1'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        display_name: 'User 2'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create tags for both users
    await db.insert(tagsTable)
      .values([
        {
          user_id: user1Id,
          name: 'user1-tag',
          color: '#ff0000'
        },
        {
          user_id: user2Id,
          name: 'user2-tag',
          color: '#00ff00'
        }
      ])
      .execute();

    // Get tags for user1 only
    const result = await getTags(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('user1-tag');
    expect(result[0].user_id).toBe(user1Id);
  });

  it('should handle tags with null color values', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create tag with null color
    await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'no-color-tag',
        color: null
      })
      .execute();

    const result = await getTags(userId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('no-color-tag');
    expect(result[0].color).toBeNull();
  });

  it('should save tags to database correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test tag
    await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'test-tag',
        color: '#123456'
      })
      .execute();

    // Fetch using handler
    const handlerResult = await getTags(userId);

    // Verify directly in database
    const dbResult = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);
    expect(handlerResult[0].name).toBe(dbResult[0].name);
    expect(handlerResult[0].color).toBe(dbResult[0].color);
    expect(handlerResult[0].user_id).toBe(dbResult[0].user_id);
  });
});
