import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput } from '../schema';
import { updateBookmark } from '../handlers/update_bookmark';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  display_name: 'Test User'
};

const testCollection = {
  name: 'Test Collection',
  description: 'A test collection'
};

const testCollection2 = {
  name: 'Another Collection',
  description: 'Another test collection'
};

const testTag1 = {
  name: 'Test Tag 1',
  color: '#ff0000'
};

const testTag2 = {
  name: 'Test Tag 2',
  color: '#00ff00'
};

const testBookmark = {
  url: 'https://example.com',
  title: 'Original Title',
  description: 'Original description',
  favicon_url: 'https://example.com/favicon.ico'
};

describe('updateBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update bookmark basic fields', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create collection
    const collections = await db.insert(collectionsTable)
      .values({ ...testCollection, user_id: userId })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId, collection_id: collectionId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Update bookmark
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Updated Title',
      description: 'Updated description',
      url: 'https://updated.com',
      favicon_url: 'https://updated.com/favicon.ico'
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(bookmarkId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.url).toEqual('https://updated.com');
    expect(result!.favicon_url).toEqual('https://updated.com/favicon.ico');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update bookmark collection', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create collections
    const collections = await db.insert(collectionsTable)
      .values([
        { ...testCollection, user_id: userId },
        { ...testCollection2, user_id: userId }
      ])
      .returning()
      .execute();
    const collection1Id = collections[0].id;
    const collection2Id = collections[1].id;

    // Create bookmark in first collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId, collection_id: collection1Id })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Update bookmark to second collection
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: collection2Id
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();
    expect(result!.collection_id).toEqual(collection2Id);
  });

  it('should set collection to null when updating with null', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create collection
    const collections = await db.insert(collectionsTable)
      .values({ ...testCollection, user_id: userId })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Create bookmark with collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId, collection_id: collectionId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Update bookmark to remove collection
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: null
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();
    expect(result!.collection_id).toBeNull();
  });

  it('should update bookmark tags', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create tags
    const tags = await db.insert(tagsTable)
      .values([
        { ...testTag1, user_id: userId },
        { ...testTag2, user_id: userId }
      ])
      .returning()
      .execute();
    const tag1Id = tags[0].id;
    const tag2Id = tags[1].id;

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Add initial tag
    await db.insert(bookmarkTagsTable)
      .values({ bookmark_id: bookmarkId, tag_id: tag1Id })
      .execute();

    // Update bookmark with different tags
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tag2Id]
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();

    // Check that old tag was removed and new tag was added
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(bookmarkTags).toHaveLength(1);
    expect(bookmarkTags[0].tag_id).toEqual(tag2Id);
  });

  it('should clear all tags when updating with empty array', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create tag
    const tags = await db.insert(tagsTable)
      .values({ ...testTag1, user_id: userId })
      .returning()
      .execute();
    const tagId = tags[0].id;

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Add initial tag
    await db.insert(bookmarkTagsTable)
      .values({ bookmark_id: bookmarkId, tag_id: tagId })
      .execute();

    // Update bookmark with no tags
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: []
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();

    // Check that all tags were removed
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(bookmarkTags).toHaveLength(0);
  });

  it('should return null when bookmark does not exist', async () => {
    const updateInput: UpdateBookmarkInput = {
      id: 999, // Non-existent bookmark
      title: 'Updated Title'
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error when collection does not belong to user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        testUser,
        { email: 'other@example.com', password_hash: 'hash', display_name: 'Other User' }
      ])
      .returning()
      .execute();
    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create collection for user 2
    const collections = await db.insert(collectionsTable)
      .values({ ...testCollection, user_id: user2Id })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Create bookmark for user 1
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: user1Id })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Try to update bookmark with collection from different user
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: collectionId
    };

    expect(() => updateBookmark(updateInput))
      .rejects.toThrow(/collection not found or does not belong to user/i);
  });

  it('should throw error when tag does not belong to user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        testUser,
        { email: 'other@example.com', password_hash: 'hash', display_name: 'Other User' }
      ])
      .returning()
      .execute();
    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create tag for user 2
    const tags = await db.insert(tagsTable)
      .values({ ...testTag1, user_id: user2Id })
      .returning()
      .execute();
    const tagId = tags[0].id;

    // Create bookmark for user 1
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: user1Id })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Try to update bookmark with tag from different user
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tagId]
    };

    expect(() => updateBookmark(updateInput))
      .rejects.toThrow(/tags not found or do not belong to user/i);
  });

  it('should update only specified fields', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;
    const originalCreatedAt = bookmarks[0].created_at;

    // Update only title
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Only Title Updated'
    };

    const result = await updateBookmark(updateInput);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.description).toEqual(testBookmark.description); // Should remain unchanged
    expect(result!.url).toEqual(testBookmark.url); // Should remain unchanged
    expect(result!.favicon_url).toEqual(testBookmark.favicon_url); // Should remain unchanged
    expect(result!.created_at).toEqual(originalCreatedAt); // Should remain unchanged
    expect(result!.updated_at).not.toEqual(originalCreatedAt); // Should be updated
  });

  it('should preserve existing bookmark data in database', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({ ...testBookmark, user_id: userId })
      .returning()
      .execute();
    const bookmarkId = bookmarks[0].id;

    // Update bookmark
    const updateInput: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Database Updated Title'
    };

    await updateBookmark(updateInput);

    // Verify changes were persisted
    const updatedBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(updatedBookmarks).toHaveLength(1);
    expect(updatedBookmarks[0].title).toEqual('Database Updated Title');
    expect(updatedBookmarks[0].description).toEqual(testBookmark.description);
    expect(updatedBookmarks[0].url).toEqual(testBookmark.url);
  });
});
