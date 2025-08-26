import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, tagsTable, bookmarkTagsTable, usersTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq, inArray } from 'drizzle-orm';

// Test inputs
const testUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password',
};

const testInput: CreateBookmarkInput = {
  user_id: 1,
  collection_id: null,
  title: 'Test Bookmark',
  url: 'https://example.com',
  description: 'A bookmark for testing',
  tags: ['test', 'example']
};

describe('createBookmark', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test user first since bookmarks reference users
    await db.insert(usersTable).values(testUser).execute();
  });
  
  afterEach(resetDB);

  it('should create a bookmark without tags', async () => {
    const input: CreateBookmarkInput = {
      user_id: 1,
      collection_id: null,
      title: 'Simple Bookmark',
      url: 'https://simple.com',
      description: 'A simple bookmark'
    };
    
    const result = await createBookmark(input);

    // Basic field validation
    expect(result.title).toEqual('Simple Bookmark');
    expect(result.url).toEqual('https://simple.com');
    expect(result.description).toEqual('A simple bookmark');
    expect(result.user_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a bookmark with tags', async () => {
    const result = await createBookmark(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Bookmark');
    expect(result.url).toEqual('https://example.com');
    expect(result.description).toEqual('A bookmark for testing');
    expect(result.user_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify bookmark was saved to database
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toEqual('Test Bookmark');

    // Verify tags were created and associated
    const tags = await db.select()
      .from(tagsTable)
      .where(inArray(tagsTable.name, ['test', 'example']))
      .execute();

    expect(tags).toHaveLength(2);
    const tagNames = tags.map(tag => tag.name);
    expect(tagNames).toContain('test');
    expect(tagNames).toContain('example');

    // Verify bookmark-tag associations
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(2);
    const associatedTagIds = bookmarkTags.map(bt => bt.tag_id);
    tags.forEach(tag => {
      expect(associatedTagIds).toContain(tag.id);
    });
  });

  it('should handle duplicate tags correctly', async () => {
    // Create a bookmark with some tags
    await createBookmark({
      user_id: 1,
      collection_id: null,
      title: 'First Bookmark',
      url: 'https://first.com',
      description: 'First test bookmark',
      tags: ['shared', 'unique1']
    });

    // Create another bookmark with some overlapping tags
    const result = await createBookmark({
      user_id: 1,
      collection_id: null,
      title: 'Second Bookmark',
      url: 'https://second.com',
      description: 'Second test bookmark',
      tags: ['shared', 'unique2']
    });

    // Verify only 3 total tags exist (shared, unique1, unique2)
    const allTags = await db.select().from(tagsTable).execute();
    expect(allTags).toHaveLength(3);

    const tagNames = allTags.map(tag => tag.name);
    expect(tagNames).toContain('shared');
    expect(tagNames).toContain('unique1');
    expect(tagNames).toContain('unique2');

    // Verify the second bookmark has the correct tags
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, result.id))
      .execute();

    expect(bookmarkTags).toHaveLength(2);
  });
});

