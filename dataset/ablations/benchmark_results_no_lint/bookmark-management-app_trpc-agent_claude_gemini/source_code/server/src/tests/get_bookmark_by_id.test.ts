import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { getBookmarkById } from '../handlers/get_bookmark_by_id';

describe('getBookmarkById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent bookmark', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();
    
    const result = await getBookmarkById(999, users[0].id);
    expect(result).toBeNull();
  });

  it('should return null for bookmark belonging to different user', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        { email: 'user1@test.com', username: 'user1' },
        { email: 'user2@test.com', username: 'user2' }
      ])
      .returning()
      .execute();

    // Create bookmark for user1
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Try to access with user2's ID
    const result = await getBookmarkById(bookmarks[0].id, users[1].id);
    expect(result).toBeNull();
  });

  it('should return bookmark without collection or tags', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();

    // Create bookmark without collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: users[0].id
      })
      .returning()
      .execute();

    const result = await getBookmarkById(bookmarks[0].id, users[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toBe(bookmarks[0].id);
    expect(result!.url).toBe('https://example.com');
    expect(result!.title).toBe('Test Bookmark');
    expect(result!.description).toBe('A test bookmark');
    expect(result!.user_id).toBe(users[0].id);
    expect(result!.collection_id).toBeNull();
    expect(result!.collection_name).toBeNull();
    expect(result!.tags).toEqual([]);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return bookmark with collection but no tags', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();

    // Create collection
    const collections = await db.insert(collectionsTable)
      .values({
        name: 'Test Collection',
        description: 'A test collection',
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Create bookmark with collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'A test bookmark',
        user_id: users[0].id,
        collection_id: collections[0].id
      })
      .returning()
      .execute();

    const result = await getBookmarkById(bookmarks[0].id, users[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toBe(bookmarks[0].id);
    expect(result!.collection_id).toBe(collections[0].id);
    expect(result!.collection_name).toBe('Test Collection');
    expect(result!.tags).toEqual([]);
  });

  it('should return bookmark with tags but no collection', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();

    // Create tags
    const tags = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', color: '#f7df1e', user_id: users[0].id },
        { name: 'Web Dev', color: '#61dafb', user_id: users[0].id }
      ])
      .returning()
      .execute();

    // Create bookmark
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://javascript.info',
        title: 'JavaScript Tutorial',
        description: 'Learn JavaScript',
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Link tags to bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarks[0].id, tag_id: tags[0].id },
        { bookmark_id: bookmarks[0].id, tag_id: tags[1].id }
      ])
      .execute();

    const result = await getBookmarkById(bookmarks[0].id, users[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toBe(bookmarks[0].id);
    expect(result!.collection_id).toBeNull();
    expect(result!.collection_name).toBeNull();
    expect(result!.tags).toHaveLength(2);
    
    // Check tags are included and in correct format
    const tagNames = result!.tags.map(tag => tag.name);
    expect(tagNames).toContain('JavaScript');
    expect(tagNames).toContain('Web Dev');
    
    const jsTag = result!.tags.find(tag => tag.name === 'JavaScript');
    expect(jsTag).toBeDefined();
    expect(jsTag!.color).toBe('#f7df1e');
    expect(jsTag!.user_id).toBe(users[0].id);
    expect(jsTag!.created_at).toBeInstanceOf(Date);
  });

  it('should return complete bookmark with collection and tags', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();

    // Create collection
    const collections = await db.insert(collectionsTable)
      .values({
        name: 'Programming Resources',
        description: 'Useful programming links',
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Create tags
    const tags = await db.insert(tagsTable)
      .values([
        { name: 'React', color: '#61dafb', user_id: users[0].id },
        { name: 'Tutorial', color: null, user_id: users[0].id }
      ])
      .returning()
      .execute();

    // Create bookmark with collection
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://react.dev',
        title: 'React Documentation',
        description: 'Official React docs',
        user_id: users[0].id,
        collection_id: collections[0].id
      })
      .returning()
      .execute();

    // Link tags to bookmark
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarks[0].id, tag_id: tags[0].id },
        { bookmark_id: bookmarks[0].id, tag_id: tags[1].id }
      ])
      .execute();

    const result = await getBookmarkById(bookmarks[0].id, users[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toBe(bookmarks[0].id);
    expect(result!.url).toBe('https://react.dev');
    expect(result!.title).toBe('React Documentation');
    expect(result!.description).toBe('Official React docs');
    expect(result!.user_id).toBe(users[0].id);
    expect(result!.collection_id).toBe(collections[0].id);
    expect(result!.collection_name).toBe('Programming Resources');
    expect(result!.tags).toHaveLength(2);

    // Verify tag details
    const reactTag = result!.tags.find(tag => tag.name === 'React');
    const tutorialTag = result!.tags.find(tag => tag.name === 'Tutorial');
    
    expect(reactTag).toBeDefined();
    expect(reactTag!.color).toBe('#61dafb');
    
    expect(tutorialTag).toBeDefined();
    expect(tutorialTag!.color).toBeNull();
    
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle bookmark with null description', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'user@test.com', username: 'testuser' })
      .returning()
      .execute();

    // Create bookmark with null description
    const bookmarks = await db.insert(bookmarksTable)
      .values({
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: null,
        user_id: users[0].id
      })
      .returning()
      .execute();

    const result = await getBookmarkById(bookmarks[0].id, users[0].id);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.url).toBe('https://example.com');
    expect(result!.title).toBe('Test Bookmark');
  });
});
