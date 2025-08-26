import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { getBookmarks } from '../handlers/get_bookmarks';

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bookmarks exist', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const result = await getBookmarks(userId);

    expect(result).toEqual([]);
  });

  it('should return bookmarks for a user without tags or collection', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a bookmark without collection
    await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: null
      })
      .execute();

    const result = await getBookmarks(userId);

    expect(result).toHaveLength(1);
    expect(result[0].url).toEqual('https://example.com');
    expect(result[0].title).toEqual('Test Bookmark');
    expect(result[0].description).toEqual('A test bookmark');
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].collection_id).toBeNull();
    expect(result[0].collection_name).toBeNull();
    expect(result[0].tags).toEqual([]);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return bookmarks with collection information', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: userId
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Create a bookmark with collection
    await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: collectionId
      })
      .execute();

    const result = await getBookmarks(userId);

    expect(result).toHaveLength(1);
    expect(result[0].collection_id).toEqual(collectionId);
    expect(result[0].collection_name).toEqual('Test Collection');
    expect(result[0].tags).toEqual([]);
  });

  it('should return bookmarks with tags', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'tag1', user_id: userId },
        { name: 'tag2', user_id: userId }
      ])
      .returning()
      .execute();
    
    const tag1Id = tagResults[0].id;
    const tag2Id = tagResults[1].id;

    // Create a bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: userId,
        collection_id: null
      })
      .returning()
      .execute();
    
    const bookmarkId = bookmarkResult[0].id;

    // Associate tags with bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarkId, tag_id: tag1Id },
        { bookmark_id: bookmarkId, tag_id: tag2Id }
      ])
      .execute();

    const result = await getBookmarks(userId);

    expect(result).toHaveLength(1);
    expect(result[0].tags).toHaveLength(2);
    expect(result[0].tags.map(t => t.name).sort()).toEqual(['tag1', 'tag2']);
    expect(result[0].tags[0].id).toBeDefined();
    expect(result[0].tags[0].user_id).toEqual(userId);
    expect(result[0].tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter bookmarks by collection when collectionId is provided', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create two collections
    const collectionResults = await db.insert(collectionsTable)
      .values([
        { name: 'Collection 1', description: 'First collection', user_id: userId },
        { name: 'Collection 2', description: 'Second collection', user_id: userId }
      ])
      .returning()
      .execute();
    
    const collection1Id = collectionResults[0].id;
    const collection2Id = collectionResults[1].id;

    // Create bookmarks in different collections
    await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://example1.com',
          title: 'Bookmark 1',
          description: 'First bookmark',
          user_id: userId,
          collection_id: collection1Id
        },
        {
          url: 'https://example2.com',
          title: 'Bookmark 2',
          description: 'Second bookmark',
          user_id: userId,
          collection_id: collection2Id
        },
        {
          url: 'https://example3.com',
          title: 'Bookmark 3',
          description: 'Third bookmark',
          user_id: userId,
          collection_id: null
        }
      ])
      .execute();

    // Test filtering by collection 1
    const result1 = await getBookmarks(userId, collection1Id);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('Bookmark 1');
    expect(result1[0].collection_name).toEqual('Collection 1');

    // Test filtering by collection 2
    const result2 = await getBookmarks(userId, collection2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toEqual('Bookmark 2');
    expect(result2[0].collection_name).toEqual('Collection 2');

    // Test getting all bookmarks
    const resultAll = await getBookmarks(userId);
    expect(resultAll).toHaveLength(3);
  });

  it('should return multiple bookmarks with mixed tags and collections', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: userId
      })
      .returning()
      .execute();
    
    const collectionId = collectionResult[0].id;

    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'web', user_id: userId },
        { name: 'tutorial', user_id: userId },
        { name: 'reference', user_id: userId }
      ])
      .returning()
      .execute();

    // Create bookmarks
    const bookmarkResults = await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://example1.com',
          title: 'Bookmark 1',
          description: 'First bookmark',
          user_id: userId,
          collection_id: collectionId
        },
        {
          url: 'https://example2.com',
          title: 'Bookmark 2',
          description: 'Second bookmark',
          user_id: userId,
          collection_id: null
        }
      ])
      .returning()
      .execute();

    // Associate tags with bookmarks
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarkResults[0].id, tag_id: tagResults[0].id }, // web
        { bookmark_id: bookmarkResults[0].id, tag_id: tagResults[1].id }, // tutorial
        { bookmark_id: bookmarkResults[1].id, tag_id: tagResults[2].id }  // reference
      ])
      .execute();

    const result = await getBookmarks(userId);

    expect(result).toHaveLength(2);
    
    // Sort by title to ensure consistent order
    result.sort((a, b) => a.title.localeCompare(b.title));

    // Check first bookmark (with collection and 2 tags)
    expect(result[0].title).toEqual('Bookmark 1');
    expect(result[0].collection_id).toEqual(collectionId);
    expect(result[0].collection_name).toEqual('Test Collection');
    expect(result[0].tags).toHaveLength(2);
    expect(result[0].tags.map(t => t.name).sort()).toEqual(['tutorial', 'web']);

    // Check second bookmark (no collection, 1 tag)
    expect(result[1].title).toEqual('Bookmark 2');
    expect(result[1].collection_id).toBeNull();
    expect(result[1].collection_name).toBeNull();
    expect(result[1].tags).toHaveLength(1);
    expect(result[1].tags[0].name).toEqual('reference');
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create two users
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashed_password1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashed_password2'
        }
      ])
      .returning()
      .execute();
    
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create bookmarks for both users
    await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://user1.com',
          title: 'User 1 Bookmark',
          description: 'Bookmark for user 1',
          user_id: user1Id,
          collection_id: null
        },
        {
          url: 'https://user2.com',
          title: 'User 2 Bookmark',
          description: 'Bookmark for user 2',
          user_id: user2Id,
          collection_id: null
        }
      ])
      .execute();

    const result1 = await getBookmarks(user1Id);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('User 1 Bookmark');

    const result2 = await getBookmarks(user2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toEqual('User 2 Bookmark');
  });
});
