import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { getBookmarkTags } from '../handlers/get_bookmark_tags';

describe('getBookmarkTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tags associated with a bookmark ordered by name', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test collection
    const [collection] = await db.insert(collectionsTable)
      .values({
        user_id: user.id,
        name: 'Test Collection',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create test bookmark
    const [bookmark] = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: collection.id,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark'
      })
      .returning()
      .execute();

    // Create test tags (inserted in reverse alphabetical order to test ordering)
    const [tag1] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'zulu',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'alpha',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const [tag3] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'beta',
        color: null
      })
      .returning()
      .execute();

    // Associate tags with bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmark.id, tag_id: tag1.id },
        { bookmark_id: bookmark.id, tag_id: tag2.id },
        { bookmark_id: bookmark.id, tag_id: tag3.id }
      ])
      .execute();

    // Test the handler
    const result = await getBookmarkTags(bookmark.id);

    // Should return 3 tags ordered by name
    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('alpha');
    expect(result[1].name).toEqual('beta');
    expect(result[2].name).toEqual('zulu');

    // Verify all fields are correctly returned
    expect(result[0].id).toEqual(tag2.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].color).toEqual('#00ff00');
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].id).toEqual(tag3.id);
    expect(result[1].color).toBeNull();

    expect(result[2].id).toEqual(tag1.id);
    expect(result[2].color).toEqual('#ff0000');
  });

  it('should return empty array for bookmark with no tags', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test bookmark without any tags
    const [bookmark] = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: null
      })
      .returning()
      .execute();

    const result = await getBookmarkTags(bookmark.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent bookmark', async () => {
    const result = await getBookmarkTags(999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return tags for the specified bookmark', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create two test bookmarks
    const [bookmark1] = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example1.com',
        title: 'Test Bookmark 1',
        description: null
      })
      .returning()
      .execute();

    const [bookmark2] = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example2.com',
        title: 'Test Bookmark 2',
        description: null
      })
      .returning()
      .execute();

    // Create tags
    const [tag1] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'tag1',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'tag2',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const [tag3] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'tag3',
        color: '#0000ff'
      })
      .returning()
      .execute();

    // Associate different tags with each bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmark1.id, tag_id: tag1.id },
        { bookmark_id: bookmark1.id, tag_id: tag2.id },
        { bookmark_id: bookmark2.id, tag_id: tag3.id }
      ])
      .execute();

    // Test that only bookmark1's tags are returned
    const result1 = await getBookmarkTags(bookmark1.id);
    expect(result1).toHaveLength(2);
    expect(result1[0].name).toEqual('tag1');
    expect(result1[1].name).toEqual('tag2');

    // Test that only bookmark2's tags are returned
    const result2 = await getBookmarkTags(bookmark2.id);
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toEqual('tag3');
  });

  it('should handle tags with same name correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test bookmark
    const [bookmark] = await db.insert(bookmarksTable)
      .values({
        user_id: user.id,
        collection_id: null,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: null
      })
      .returning()
      .execute();

    // Create tags with same name but different IDs (this shouldn't happen in practice due to business logic,
    // but tests the database query behavior)
    const [tag1] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'duplicate',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        user_id: user.id,
        name: 'duplicate',
        color: '#00ff00'
      })
      .returning()
      .execute();

    // Associate both tags with bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmark.id, tag_id: tag1.id },
        { bookmark_id: bookmark.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getBookmarkTags(bookmark.id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('duplicate');
    expect(result[1].name).toEqual('duplicate');
    // Should have different IDs
    expect(result[0].id).not.toEqual(result[1].id);
  });
});
