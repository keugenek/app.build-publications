import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput } from '../schema';
import { updateBookmark } from '../handlers/update_bookmark';
import { eq } from 'drizzle-orm';

describe('updateBookmark', () => {
  let userId: number;
  let collectionId: number;
  let bookmarkId: number;
  let tagId1: number;
  let tagId2: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A collection for testing'
      })
      .returning()
      .execute();
    collectionId = collectionResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Tag1',
        color: '#ff0000'
      })
      .returning()
      .execute();
    tagId1 = tag1Result[0].id;

    const tag2Result = await db.insert(tagsTable)
      .values({
        user_id: userId,
        name: 'Tag2',
        color: '#00ff00'
      })
      .returning()
      .execute();
    tagId2 = tag2Result[0].id;

    // Create test bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        user_id: userId,
        collection_id: collectionId,
        title: 'Original Title',
        url: 'https://original.example.com',
        description: 'Original description'
      })
      .returning()
      .execute();
    bookmarkId = bookmarkResult[0].id;

    // Add initial tag association
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: bookmarkId,
        tag_id: tagId1
      })
      .execute();
  });

  afterEach(resetDB);

  it('should update bookmark title', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Updated Title'
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual('https://original.example.com'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update bookmark URL', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      url: 'https://updated.example.com'
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.url).toEqual('https://updated.example.com');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update bookmark description', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      description: 'Updated description'
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.description).toEqual('Updated description');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.url).toEqual('https://original.example.com'); // Should remain unchanged
  });

  it('should set description to null', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      description: null
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.description).toBeNull();
  });

  it('should update collection_id', async () => {
    // Create another collection
    const newCollectionResult = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'New Collection',
        description: 'Another collection'
      })
      .returning()
      .execute();
    const newCollectionId = newCollectionResult[0].id;

    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: newCollectionId
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.collection_id).toEqual(newCollectionId);
  });

  it('should set collection_id to null', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      collection_id: null
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.collection_id).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Multi-Update Title',
      url: 'https://multi-update.example.com',
      description: 'Multi-update description'
    };

    const result = await updateBookmark(input);

    expect(result.id).toEqual(bookmarkId);
    expect(result.title).toEqual('Multi-Update Title');
    expect(result.url).toEqual('https://multi-update.example.com');
    expect(result.description).toEqual('Multi-update description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated bookmark to database', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Database Updated Title'
    };

    await updateBookmark(input);

    // Verify in database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, bookmarkId))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toEqual('Database Updated Title');
    expect(bookmarks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update tag associations when tag_ids provided', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tagId2] // Replace tagId1 with tagId2
    };

    await updateBookmark(input);

    // Verify old association is removed and new one is added
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(1);
    expect(tagAssociations[0].tag_id).toEqual(tagId2);
  });

  it('should remove all tag associations when empty tag_ids provided', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [] // Remove all tags
    };

    await updateBookmark(input);

    // Verify no associations exist
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(0);
  });

  it('should add multiple tag associations', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      tag_ids: [tagId1, tagId2] // Add both tags
    };

    await updateBookmark(input);

    // Verify both associations exist
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(2);
    const tagIds = tagAssociations.map(ta => ta.tag_id);
    expect(tagIds).toContain(tagId1);
    expect(tagIds).toContain(tagId2);
  });

  it('should not modify tag associations when tag_ids not provided', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Updated without tags'
      // tag_ids not provided - should leave existing associations unchanged
    };

    await updateBookmark(input);

    // Verify original association still exists
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(1);
    expect(tagAssociations[0].tag_id).toEqual(tagId1);
  });

  it('should throw error when bookmark does not exist', async () => {
    const input: UpdateBookmarkInput = {
      id: 99999, // Non-existent ID
      title: 'Should fail'
    };

    await expect(updateBookmark(input)).rejects.toThrow(/Bookmark with id 99999 not found/i);
  });

  it('should update both bookmark fields and tag associations', async () => {
    const input: UpdateBookmarkInput = {
      id: bookmarkId,
      title: 'Combined Update',
      description: 'Updated with new tags',
      tag_ids: [tagId2]
    };

    const result = await updateBookmark(input);

    // Verify bookmark updates
    expect(result.title).toEqual('Combined Update');
    expect(result.description).toEqual('Updated with new tags');

    // Verify tag association update
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    expect(tagAssociations).toHaveLength(1);
    expect(tagAssociations[0].tag_id).toEqual(tagId2);
  });
});
