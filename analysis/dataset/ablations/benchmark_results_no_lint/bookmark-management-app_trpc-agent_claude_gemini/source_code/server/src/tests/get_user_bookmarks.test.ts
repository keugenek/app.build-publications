import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { getUserBookmarks } from '../handlers/get_user_bookmarks';

describe('getUserBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no bookmarks', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
      })
      .returning()
      .execute();

    const result = await getUserBookmarks(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return bookmarks with collection and tags', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create a collection
    const collections = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: userId,
      })
      .returning()
      .execute();

    const collectionId = collections[0].id;

    // Create tags
    const tags = await db.insert(tagsTable)
      .values([
        {
          name: 'JavaScript',
          color: '#F7DF1E',
          user_id: userId,
        },
        {
          name: 'React',
          color: '#61DAFB',
          user_id: userId,
        },
      ])
      .returning()
      .execute();

    // Create bookmarks
    const bookmarks = await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://example.com',
          title: 'Example Website',
          description: 'An example website',
          user_id: userId,
          collection_id: collectionId,
        },
        {
          url: 'https://test.com',
          title: 'Test Website',
          description: null,
          user_id: userId,
          collection_id: null,
        },
      ])
      .returning()
      .execute();

    // Add tags to first bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        {
          bookmark_id: bookmarks[0].id,
          tag_id: tags[0].id,
        },
        {
          bookmark_id: bookmarks[0].id,
          tag_id: tags[1].id,
        },
      ])
      .execute();

    const result = await getUserBookmarks(userId);

    expect(result).toHaveLength(2);

    // Check first bookmark (should have collection and tags)
    const firstBookmark = result.find(b => b.id === bookmarks[0].id);
    expect(firstBookmark).toBeDefined();
    expect(firstBookmark!.url).toEqual('https://example.com');
    expect(firstBookmark!.title).toEqual('Example Website');
    expect(firstBookmark!.description).toEqual('An example website');
    expect(firstBookmark!.collection_id).toEqual(collectionId);
    expect(firstBookmark!.collection_name).toEqual('Test Collection');
    expect(firstBookmark!.tags).toHaveLength(2);
    expect(firstBookmark!.tags.map(t => t.name).sort()).toEqual(['JavaScript', 'React']);

    // Check second bookmark (no collection, no tags)
    const secondBookmark = result.find(b => b.id === bookmarks[1].id);
    expect(secondBookmark).toBeDefined();
    expect(secondBookmark!.url).toEqual('https://test.com');
    expect(secondBookmark!.title).toEqual('Test Website');
    expect(secondBookmark!.description).toBeNull();
    expect(secondBookmark!.collection_id).toBeNull();
    expect(secondBookmark!.collection_name).toBeNull();
    expect(secondBookmark!.tags).toHaveLength(0);
  });

  it('should return bookmarks ordered by most recent activity', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create bookmarks with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const bookmarks = await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://old.com',
          title: 'Old Bookmark',
          user_id: userId,
          created_at: twoDaysAgo,
          updated_at: twoDaysAgo,
        },
        {
          url: 'https://new.com',
          title: 'New Bookmark',
          user_id: userId,
          created_at: now,
          updated_at: now,
        },
        {
          url: 'https://updated.com',
          title: 'Updated Bookmark',
          user_id: userId,
          created_at: twoDaysAgo,
          updated_at: yesterday,
        },
      ])
      .returning()
      .execute();

    const result = await getUserBookmarks(userId);

    expect(result).toHaveLength(3);
    
    // Should be ordered by most recent activity (created_at or updated_at)
    expect(result[0].title).toEqual('New Bookmark'); // Most recent
    expect(result[1].title).toEqual('Updated Bookmark'); // Updated yesterday
    expect(result[2].title).toEqual('Old Bookmark'); // Oldest
  });

  it('should only return bookmarks for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
        },
        {
          email: 'user2@example.com',
          username: 'user2',
        },
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create bookmarks for both users
    await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://user1.com',
          title: 'User 1 Bookmark',
          user_id: user1Id,
        },
        {
          url: 'https://user2.com',
          title: 'User 2 Bookmark',
          user_id: user2Id,
        },
      ])
      .execute();

    const user1Result = await getUserBookmarks(user1Id);
    const user2Result = await getUserBookmarks(user2Id);

    expect(user1Result).toHaveLength(1);
    expect(user1Result[0].title).toEqual('User 1 Bookmark');
    expect(user1Result[0].user_id).toEqual(user1Id);

    expect(user2Result).toHaveLength(1);
    expect(user2Result[0].title).toEqual('User 2 Bookmark');
    expect(user2Result[0].user_id).toEqual(user2Id);
  });

  it('should handle bookmarks with complex tag relationships', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create multiple tags
    const tags = await db.insert(tagsTable)
      .values([
        {
          name: 'Frontend',
          color: '#FF0000',
          user_id: userId,
        },
        {
          name: 'Backend',
          color: '#00FF00',
          user_id: userId,
        },
        {
          name: 'Database',
          color: '#0000FF',
          user_id: userId,
        },
      ])
      .returning()
      .execute();

    // Create bookmarks
    const bookmarks = await db.insert(bookmarksTable)
      .values([
        {
          url: 'https://fullstack.com',
          title: 'Full Stack Tutorial',
          user_id: userId,
        },
        {
          url: 'https://db.com',
          title: 'Database Guide',
          user_id: userId,
        },
      ])
      .returning()
      .execute();

    // Add different tag combinations
    await db.insert(bookmarkTagsTable)
      .values([
        // First bookmark has all three tags
        { bookmark_id: bookmarks[0].id, tag_id: tags[0].id },
        { bookmark_id: bookmarks[0].id, tag_id: tags[1].id },
        { bookmark_id: bookmarks[0].id, tag_id: tags[2].id },
        // Second bookmark has only database tag
        { bookmark_id: bookmarks[1].id, tag_id: tags[2].id },
      ])
      .execute();

    const result = await getUserBookmarks(userId);

    expect(result).toHaveLength(2);

    const fullStackBookmark = result.find(b => b.title === 'Full Stack Tutorial');
    expect(fullStackBookmark!.tags).toHaveLength(3);
    expect(fullStackBookmark!.tags.map(t => t.name).sort()).toEqual(['Backend', 'Database', 'Frontend']);

    const dbBookmark = result.find(b => b.title === 'Database Guide');
    expect(dbBookmark!.tags).toHaveLength(1);
    expect(dbBookmark!.tags[0].name).toEqual('Database');
  });
});
