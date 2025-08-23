import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tables } from '../db/schema';
import { eq } from 'drizzle-orm';
import { assignCollectionToBookmark } from '../handlers/assign_collection_to_bookmark';

describe('assignCollectionToBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a user
  const createUser = async () => {
    const [user] = await db
      .insert(tables.users)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
      })
      .returning()
      .execute();
    return user;
  };

  // Helper to create a bookmark
  const createBookmark = async (userId: number) => {
    const [bookmark] = await db
      .insert(tables.bookmarks)
      .values({
        url: 'https://example.com',
        title: 'Example',
        user_id: userId,
      })
      .returning()
      .execute();
    return bookmark;
  };

  // Helper to create a collection
  const createCollection = async (userId: number) => {
    const [collection] = await db
      .insert(tables.collections)
      .values({
        name: 'My Collection',
        user_id: userId,
      })
      .returning()
      .execute();
    return collection;
  };

  it('should assign a collection to a bookmark and return the bookmark', async () => {
    const user = await createUser();
    const bookmark = await createBookmark(user.id);
    const collection = await createCollection(user.id);

    const result = await assignCollectionToBookmark({
      bookmark_id: bookmark.id,
      collection_id: collection.id,
    });

    // Verify returned bookmark matches the original
    expect(result.id).toBe(bookmark.id);
    expect(result.url).toBe(bookmark.url);
    expect(result.title).toBe(bookmark.title);
    expect(result.user_id).toBe(user.id);

    // Verify linking record exists
    const links = await db
      .select()
      .from(tables.bookmarkCollections)
      .where(eq(tables.bookmarkCollections.bookmark_id, bookmark.id))
      .execute();
    expect(links).toHaveLength(1);
    expect(links[0].collection_id).toBe(collection.id);
  });

  it('should throw an error when the bookmark does not exist', async () => {
    const user = await createUser();
    const collection = await createCollection(user.id);

    await expect(
      assignCollectionToBookmark({
        bookmark_id: 9999, // non‑existent
        collection_id: collection.id,
      })
    ).rejects.toThrow('Bookmark not found');
  });
});
