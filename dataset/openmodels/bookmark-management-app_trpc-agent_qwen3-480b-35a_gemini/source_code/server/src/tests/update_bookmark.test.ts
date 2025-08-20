import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable, tagsTable, bookmarkTagsTable, collectionsTable, bookmarkCollectionsTable } from '../db/schema';
import { type UpdateBookmarkInput, type CreateUserInput, type CreateBookmarkInput } from '../schema';
import { updateBookmark } from '../handlers/update_bookmark';
import { eq } from 'drizzle-orm';

// Test helper to create a user
const createUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: input.email,
      name: input.name ?? '',
      password_hash: 'hashed_password'
    })
    .returning()
    .execute();
  return result[0];
};

// Test helper to create a bookmark
const createBookmark = async (user_id: number, title: string, url: string, description: string | null = null) => {
  const result = await db.insert(bookmarksTable)
    .values({
      user_id,
      title,
      url,
      description,
      is_public: false
    })
    .returning()
    .execute();
  return result[0];
};

// Test helper to create a collection
const createCollection = async (user_id: number, name: string, description: string | null = null) => {
  const result = await db.insert(collectionsTable)
    .values({
      user_id,
      name,
      description,
      is_public: false
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a bookmark', async () => {
    // Create user first
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create bookmark
    const bookmark = await createBookmark(user.id, 'Original Title', 'https://example.com', 'Original description');

    // Update input
    const updateInput: UpdateBookmarkInput = {
      id: bookmark.id,
      user_id: user.id,
      title: 'Updated Title',
      url: 'https://updated-example.com',
      description: 'Updated description'
    };

    const result = await updateBookmark(updateInput);

    // Basic field validation
    expect(result.id).toEqual(bookmark.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual('https://updated-example.com');
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated bookmark to database', async () => {
    // Create user first
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create bookmark
    const bookmark = await createBookmark(user.id, 'Original Title', 'https://example.com', 'Original description');

    // Update input
    const updateInput: UpdateBookmarkInput = {
      id: bookmark.id,
      user_id: user.id,
      title: 'Updated Title',
      url: 'https://updated-example.com'
    };

    await updateBookmark(updateInput);

    // Query the updated bookmark
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmark.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toEqual('Updated Title');
    expect(bookmarks[0].url).toEqual('https://updated-example.com');
    expect(bookmarks[0].updated_at).toBeInstanceOf(Date);
    expect(bookmarks[0].updated_at.getTime()).toBeGreaterThanOrEqual(bookmarks[0].created_at.getTime());
  });

  it('should associate bookmark with a collection', async () => {
    // Create user
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create collection
    const collection = await createCollection(user.id, 'Test Collection');

    // Create bookmark
    const bookmark = await createBookmark(user.id, 'Test Bookmark', 'https://example.com');

    // Update bookmark to associate with collection
    const updateInput: UpdateBookmarkInput = {
      id: bookmark.id,
      user_id: user.id,
      collection_id: collection.id
    };

    const result = await updateBookmark(updateInput);

    expect(result.collection_id).toEqual(collection.id);

    // Verify in database
    const bookmarkCollections = await db.select()
      .from(bookmarkCollectionsTable)
      .where(eq(bookmarkCollectionsTable.bookmark_id, bookmark.id))
      .execute();

    expect(bookmarkCollections).toHaveLength(1);
    expect(bookmarkCollections[0].collection_id).toEqual(collection.id);
  });

  it('should update bookmark tags', async () => {
    // Create user
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create bookmark
    const bookmark = await createBookmark(user.id, 'Test Bookmark', 'https://example.com');

    // Update bookmark with tags
    const updateInput: UpdateBookmarkInput = {
      id: bookmark.id,
      user_id: user.id,
      tags: ['javascript', 'programming', 'tutorial']
    };

    await updateBookmark(updateInput);

    // Verify tags were created
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, user.id))
      .execute();

    expect(tags).toHaveLength(3);
    const tagNames = tags.map(t => t.name);
    expect(tagNames).toContain('javascript');
    expect(tagNames).toContain('programming');
    expect(tagNames).toContain('tutorial');

    // Verify bookmark-tag associations
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmark.id))
      .execute();

    expect(bookmarkTags).toHaveLength(3);
  });

  it('should fail when trying to update non-existent bookmark', async () => {
    const updateInput: UpdateBookmarkInput = {
      id: 99999,
      user_id: 1,
      title: 'Non-existent bookmark'
    };

    await expect(updateBookmark(updateInput))
      .rejects
      .toThrow('Bookmark not found or does not belong to the user');
  });

  it('should fail when trying to update bookmark belonging to another user', async () => {
    // Create first user
    const user1 = await createUser({
      email: 'user1@example.com',
      name: 'User 1'
    });

    // Create second user
    const user2 = await createUser({
      email: 'user2@example.com',
      name: 'User 2'
    });

    // Create bookmark for user1
    const bookmark = await createBookmark(user1.id, 'User 1 Bookmark', 'https://example.com');

    // Try to update with user2's ID
    const updateInput: UpdateBookmarkInput = {
      id: bookmark.id,
      user_id: user2.id,
      title: 'Trying to update user1\'s bookmark'
    };

    await expect(updateBookmark(updateInput))
      .rejects
      .toThrow('Bookmark not found or does not belong to the user');
  });
});
