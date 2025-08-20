import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

describe('createBookmark', () => {
  let testUserId: number;
  let testCollectionId: number;
  let testTagId1: number;
  let testTagId2: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: testUserId
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create test tags
    const tagResult1 = await db.insert(tagsTable)
      .values({
        name: 'JavaScript',
        color: '#f7df1e',
        user_id: testUserId
      })
      .returning()
      .execute();
    testTagId1 = tagResult1[0].id;

    const tagResult2 = await db.insert(tagsTable)
      .values({
        name: 'Tutorial',
        color: '#007acc',
        user_id: testUserId
      })
      .returning()
      .execute();
    testTagId2 = tagResult2[0].id;
  });

  afterEach(resetDB);

  it('should create a basic bookmark without collection or tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'A basic example website',
      user_id: testUserId,
      collection_id: null
    };

    const result = await createBookmark(input);

    expect(result.id).toBeDefined();
    expect(result.url).toEqual('https://example.com');
    expect(result.title).toEqual('Example Site');
    expect(result.description).toEqual('A basic example website');
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toBeNull();
    expect(result.collection_name).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a bookmark with collection', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://developer.mozilla.org',
      title: 'MDN Web Docs',
      description: 'Mozilla Developer Network',
      user_id: testUserId,
      collection_id: testCollectionId
    };

    const result = await createBookmark(input);

    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.collection_name).toEqual('Test Collection');
  });

  it('should create a bookmark with tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://javascript.info',
      title: 'The Modern JavaScript Tutorial',
      description: 'JavaScript tutorial and reference',
      user_id: testUserId,
      collection_id: null,
      tag_ids: [testTagId1, testTagId2]
    };

    const result = await createBookmark(input);

    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(tag => tag.name)).toContain('JavaScript');
    expect(result.tags.map(tag => tag.name)).toContain('Tutorial');
    expect(result.tags.map(tag => tag.color)).toContain('#f7df1e');
    expect(result.tags.map(tag => tag.color)).toContain('#007acc');
  });

  it('should create a bookmark with both collection and tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://reactjs.org',
      title: 'React Documentation',
      description: 'Official React documentation',
      user_id: testUserId,
      collection_id: testCollectionId,
      tag_ids: [testTagId1]
    };

    const result = await createBookmark(input);

    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.collection_name).toEqual('Test Collection');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('JavaScript');
  });

  it('should save bookmark to database', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://github.com',
      title: 'GitHub',
      description: 'Code hosting platform',
      user_id: testUserId,
      collection_id: testCollectionId
    };

    const result = await createBookmark(input);

    // Verify bookmark was saved
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].url).toEqual('https://github.com');
    expect(bookmarks[0].title).toEqual('GitHub');
    expect(bookmarks[0].user_id).toEqual(testUserId);
    expect(bookmarks[0].collection_id).toEqual(testCollectionId);
  });

  it('should save bookmark-tag associations to database', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://nodejs.org',
      title: 'Node.js',
      description: 'JavaScript runtime',
      user_id: testUserId,
      collection_id: null,
      tag_ids: [testTagId1, testTagId2]
    };

    const result = await createBookmark(input);

    // Verify tag associations were created
    const tagAssociations = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(2);
    expect(tagAssociations.map(assoc => assoc.tag_id)).toContain(testTagId1);
    expect(tagAssociations.map(assoc => assoc.tag_id)).toContain(testTagId2);
  });

  it('should handle bookmark with minimal required fields', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://minimal.com',
      title: 'Minimal Bookmark',
      description: null,
      user_id: testUserId,
      collection_id: null
    };

    const result = await createBookmark(input);

    expect(result.description).toBeNull();
    expect(result.collection_id).toBeNull();
    expect(result.collection_name).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it('should throw error for non-existent collection', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'Test description',
      user_id: testUserId,
      collection_id: 99999 // Non-existent collection ID
    };

    await expect(createBookmark(input)).rejects.toThrow(/Collection with id 99999 not found/i);
  });

  it('should throw error for non-existent tags', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'Test description',
      user_id: testUserId,
      collection_id: null,
      tag_ids: [testTagId1, 99999] // Mix of valid and invalid tag IDs
    };

    await expect(createBookmark(input)).rejects.toThrow(/One or more tag IDs not found/i);
  });

  it('should handle empty tag_ids array', async () => {
    const input: CreateBookmarkInput = {
      url: 'https://example.com',
      title: 'Test Bookmark',
      description: 'Test description',
      user_id: testUserId,
      collection_id: null,
      tag_ids: []
    };

    const result = await createBookmark(input);

    expect(result.tags).toEqual([]);
  });
});
