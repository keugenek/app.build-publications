import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users, bookmarks, collections, bookmarkCollections } from '../db/schema';
import { type AssignCollectionToBookmarkInput, type Bookmark } from '../schema';
import { removeCollectionFromBookmark } from '../handlers/remove_collection_from_bookmark';
import { eq, and } from 'drizzle-orm';

/** Helper to create a user */
const createUser = async () => {
  const [user] = await db
    .insert(users)
    .values({ email: 'test@example.com', password_hash: 'hash' })
    .returning()
    .execute();
  return user;
};

/** Helper to create a bookmark */
const createBookmark = async (userId: number) => {
  const [bookmark] = await db
    .insert(bookmarks)
    .values({ url: 'https://example.com', title: 'Example', user_id: userId })
    .returning()
    .execute();
  return bookmark;
};

/** Helper to create a collection */
const createCollection = async (userId: number) => {
  const [collection] = await db
    .insert(collections)
    .values({ name: 'My Collection', user_id: userId })
    .returning()
    .execute();
  return collection;
};

/** Helper to link collection to bookmark */
const linkCollection = async (bookmarkId: number, collectionId: number) => {
  await db
    .insert(bookmarkCollections)
    .values({ bookmark_id: bookmarkId, collection_id: collectionId })
    .execute();
};

describe('removeCollectionFromBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete the link and return the updated bookmark', async () => {
    const user = await createUser();
    const bookmark = await createBookmark(user.id);
    const collection = await createCollection(user.id);
    await linkCollection(bookmark.id, collection.id);

    const input: AssignCollectionToBookmarkInput = {
      bookmark_id: bookmark.id,
      collection_id: collection.id,
    };

    const result: Bookmark = await removeCollectionFromBookmark(input);

    // Verify returned bookmark matches original data
    expect(result.id).toBe(bookmark.id);
    expect(result.url).toBe(bookmark.url);
    expect(result.title).toBe(bookmark.title);
    expect(result.description).toBe(bookmark.description ?? null);
    expect(result.user_id).toBe(bookmark.user_id ?? null);

    // Verify linking row is removed
    const links = await db
      .select()
      .from(bookmarkCollections)
      .where(
        and(
          eq(bookmarkCollections.bookmark_id, bookmark.id),
          eq(bookmarkCollections.collection_id, collection.id),
        ),
      )
      .execute();
    expect(links).toHaveLength(0);
  });
});
