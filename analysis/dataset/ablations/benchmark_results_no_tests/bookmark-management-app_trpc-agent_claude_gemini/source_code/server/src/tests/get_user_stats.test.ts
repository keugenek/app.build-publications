import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, collectionsTable, tagsTable } from '../db/schema';
import { getUserStats } from '../handlers/get_user_stats';

describe('getUserStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats for user with no data', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const stats = await getUserStats(userId);

    expect(stats.user_id).toEqual(userId);
    expect(stats.total_bookmarks).toEqual(0);
    expect(stats.total_collections).toEqual(0);
    expect(stats.total_tags).toEqual(0);
  });

  it('should return correct stats for user with data', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create 3 collections
    await db.insert(collectionsTable)
      .values([
        { user_id: userId, name: 'Collection 1', description: 'First collection' },
        { user_id: userId, name: 'Collection 2', description: 'Second collection' },
        { user_id: userId, name: 'Collection 3', description: null }
      ])
      .execute();

    // Create 2 tags
    await db.insert(tagsTable)
      .values([
        { user_id: userId, name: 'Tag 1', color: '#ff0000' },
        { user_id: userId, name: 'Tag 2', color: null }
      ])
      .execute();

    // Create 5 bookmarks
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          collection_id: null,
          url: 'https://example1.com',
          title: 'Example 1',
          description: 'First example'
        },
        {
          user_id: userId,
          collection_id: null,
          url: 'https://example2.com',
          title: 'Example 2',
          description: null
        },
        {
          user_id: userId,
          collection_id: null,
          url: 'https://example3.com',
          title: 'Example 3',
          description: 'Third example'
        },
        {
          user_id: userId,
          collection_id: null,
          url: 'https://example4.com',
          title: 'Example 4',
          description: null
        },
        {
          user_id: userId,
          collection_id: null,
          url: 'https://example5.com',
          title: 'Example 5',
          description: 'Fifth example'
        }
      ])
      .execute();

    const stats = await getUserStats(userId);

    expect(stats.user_id).toEqual(userId);
    expect(stats.total_bookmarks).toEqual(5);
    expect(stats.total_collections).toEqual(3);
    expect(stats.total_tags).toEqual(2);
  });

  it('should only count data for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1',
        display_name: 'User 1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2',
        display_name: 'User 2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create data for user 1
    await db.insert(collectionsTable)
      .values([
        { user_id: user1Id, name: 'User 1 Collection', description: 'Collection for user 1' }
      ])
      .execute();

    await db.insert(tagsTable)
      .values([
        { user_id: user1Id, name: 'User 1 Tag', color: '#ff0000' }
      ])
      .execute();

    await db.insert(bookmarksTable)
      .values([
        {
          user_id: user1Id,
          collection_id: null,
          url: 'https://user1-example.com',
          title: 'User 1 Bookmark',
          description: 'Bookmark for user 1'
        }
      ])
      .execute();

    // Create data for user 2
    await db.insert(collectionsTable)
      .values([
        { user_id: user2Id, name: 'User 2 Collection 1', description: 'First collection for user 2' },
        { user_id: user2Id, name: 'User 2 Collection 2', description: 'Second collection for user 2' }
      ])
      .execute();

    await db.insert(tagsTable)
      .values([
        { user_id: user2Id, name: 'User 2 Tag 1', color: '#00ff00' },
        { user_id: user2Id, name: 'User 2 Tag 2', color: '#0000ff' },
        { user_id: user2Id, name: 'User 2 Tag 3', color: null }
      ])
      .execute();

    await db.insert(bookmarksTable)
      .values([
        {
          user_id: user2Id,
          collection_id: null,
          url: 'https://user2-example1.com',
          title: 'User 2 Bookmark 1',
          description: 'First bookmark for user 2'
        },
        {
          user_id: user2Id,
          collection_id: null,
          url: 'https://user2-example2.com',
          title: 'User 2 Bookmark 2',
          description: 'Second bookmark for user 2'
        },
        {
          user_id: user2Id,
          collection_id: null,
          url: 'https://user2-example3.com',
          title: 'User 2 Bookmark 3',
          description: null
        },
        {
          user_id: user2Id,
          collection_id: null,
          url: 'https://user2-example4.com',
          title: 'User 2 Bookmark 4',
          description: 'Fourth bookmark for user 2'
        }
      ])
      .execute();

    // Get stats for user 1
    const user1Stats = await getUserStats(user1Id);
    expect(user1Stats.user_id).toEqual(user1Id);
    expect(user1Stats.total_bookmarks).toEqual(1);
    expect(user1Stats.total_collections).toEqual(1);
    expect(user1Stats.total_tags).toEqual(1);

    // Get stats for user 2
    const user2Stats = await getUserStats(user2Id);
    expect(user2Stats.user_id).toEqual(user2Id);
    expect(user2Stats.total_bookmarks).toEqual(4);
    expect(user2Stats.total_collections).toEqual(2);
    expect(user2Stats.total_tags).toEqual(3);
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 99999;

    const stats = await getUserStats(nonExistentUserId);

    expect(stats.user_id).toEqual(nonExistentUserId);
    expect(stats.total_bookmarks).toEqual(0);
    expect(stats.total_collections).toEqual(0);
    expect(stats.total_tags).toEqual(0);
  });

  it('should handle mixed data scenarios correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'mixed@example.com',
        password_hash: 'hashedpassword',
        display_name: 'Mixed Data User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A collection with bookmarks'
      })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    // Create some bookmarks - some in collection, some not
    await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          collection_id: collectionId,
          url: 'https://in-collection.com',
          title: 'In Collection',
          description: 'This bookmark is in a collection'
        },
        {
          user_id: userId,
          collection_id: null,
          url: 'https://no-collection.com',
          title: 'No Collection',
          description: 'This bookmark has no collection'
        },
        {
          user_id: userId,
          collection_id: collectionId,
          url: 'https://also-in-collection.com',
          title: 'Also In Collection',
          description: null
        }
      ])
      .execute();

    // Create some tags
    await db.insert(tagsTable)
      .values([
        { user_id: userId, name: 'Work', color: '#ff0000' },
        { user_id: userId, name: 'Personal', color: null },
        { user_id: userId, name: 'Research', color: '#00ff00' },
        { user_id: userId, name: 'Fun', color: '#0000ff' }
      ])
      .execute();

    const stats = await getUserStats(userId);

    expect(stats.user_id).toEqual(userId);
    expect(stats.total_bookmarks).toEqual(3);
    expect(stats.total_collections).toEqual(1);
    expect(stats.total_tags).toEqual(4);
  });
});
