import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput } from '../schema';
import { updateBookmark } from '../handlers/update_bookmark';
import { eq } from 'drizzle-orm';

describe('updateBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let collectionId: number;
  let tagId1: number;
  let tagId2: number;
  let bookmarkId: number;

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: userId
      })
      .returning()
      .execute();
    collectionId = collections[0].id;

    // Create test tags
    const tags1 = await db.insert(tagsTable)
      .values({
        name: 'tag1',
        user_id: userId
      })
      .returning()
      .execute();
    tagId1 = tags1[0].id;

    const tags2 = await db.insert(tagsTable)
      .values({
        name: 'tag2',
        user_id: userId
      })
      .returning()
      .execute();
    tagId2 = tags2[0].id;

    // Create test bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Original Title',
        description: 'Original description',
        user_id: userId,
        collection_id: collectionId
      })
      .returning()
      .execute();
    bookmarkId = bookmarks[0].id;

    // Add initial tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId1
      })
      .execute();
  });

  it('should update bookmark title', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Updated Title'
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.url).toEqual('https://example.com'); // Should remain unchanged
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.user_id).toEqual(userId);
    expect(result!.collection_id).toEqual(collectionId);
    expect(result!.collection_name).toEqual('Test Collection');
  });

  it('should update bookmark URL', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      url: 'https://updated-example.com'
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.url).toEqual('https://updated-example.com');
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update bookmark description', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      description: 'Updated description'
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.description).toEqual('Updated description');
  });

  it('should set description to null', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      description: null
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'New Title',
      url: 'https://new-url.com',
      description: 'New description'
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('New Title');
    expect(result!.url).toEqual('https://new-url.com');
    expect(result!.description).toEqual('New description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(result!.created_at.getTime());
  });

  it('should update collection_id', async () => {
    // Create another collection
    const newCollections = await db.insert(collectionsTable)
      .values({
        name: 'New Collection',
        description: 'A new collection',
        user_id: userId
      })
      .returning()
      .execute();
    const newCollectionId = newCollections[0].id;

    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: newCollectionId
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.collection_id).toEqual(newCollectionId);
    expect(result!.collection_name).toEqual('New Collection');
  });

  it('should set collection_id to null', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: null
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.collection_id).toBeNull();
    expect(result!.collection_name).toBeNull();
  });

  it('should update tag associations', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tagId2] // Change from tagId1 to tagId2
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0].id).toEqual(tagId2);
    expect(result!.tags[0].name).toEqual('tag2');

    // Verify old tag association is removed
    const oldAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    
    expect(oldAssociations).toHaveLength(1);
    expect(oldAssociations[0].tag_id).toEqual(tagId2);
  });

  it('should add multiple tag associations', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tagId1, tagId2] // Both tags
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.tags).toHaveLength(2);
    
    const tagIds = result!.tags.map(tag => tag.id).sort();
    expect(tagIds).toEqual([tagId1, tagId2].sort());
  });

  it('should remove all tag associations when empty array provided', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [] // Remove all tags
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.tags).toHaveLength(0);

    // Verify associations are removed from database
    const associations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();
    
    expect(associations).toHaveLength(0);
  });

  it('should return null for non-existent bookmark', async () => {
    const input: UpdateBookmarkInput = {
      id: 99999, // Non-existent ID
      title: 'New Title'
    };

    const result = await updateBookmark(input);

    expect(result).toBeNull();
  });

  it('should throw error for invalid collection_id', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: 99999 // Non-existent collection
    };

    expect(updateBookmark(input)).rejects.toThrow(/collection not found/i);
  });

  it('should throw error for collection belonging to different user', async () => {
    // Create another user and their collection
    const otherUsers = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const otherCollections = await db.insert(collectionsTable)
      .values({
        name: 'Other Collection',
        description: 'Another user collection',
        user_id: otherUsers[0].id
      })
      .returning()
      .execute();

    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: otherCollections[0].id
    };

    expect(updateBookmark(input)).rejects.toThrow(/collection not found/i);
  });

  it('should throw error for invalid tag_id', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [99999] // Non-existent tag
    };

    expect(updateBookmark(input)).rejects.toThrow(/tags not found/i);
  });

  it('should throw error for tag belonging to different user', async () => {
    // Create another user and their tag
    const otherUsers = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const otherTags = await db.insert(tagsTable)
      .values({
        name: 'othertag',
        user_id: otherUsers[0].id
      })
      .returning()
      .execute();

    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [otherTags[0].id]
    };

    expect(updateBookmark(input)).rejects.toThrow(/tags not found/i);
  });

  it('should preserve existing data when no updates provided', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId
    };

    const result = await updateBookmark(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Original Title');
    expect(result!.url).toEqual('https://example.com');
    expect(result!.description).toEqual('Original description');
    expect(result!.collection_id).toEqual(collectionId);
    expect(result!.tags).toHaveLength(1); // Should preserve existing tag association
    expect(result!.tags[0].id).toEqual(tagId1);
  });
});
