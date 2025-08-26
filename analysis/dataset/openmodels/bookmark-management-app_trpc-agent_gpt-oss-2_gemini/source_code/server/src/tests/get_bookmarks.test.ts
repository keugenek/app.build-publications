import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users } from '../db/schema';
import { bookmarks } from '../db/schema';
import { type Bookmark } from '../schema';
import { getBookmarks } from '../handlers/get_bookmarks';
import { eq } from 'drizzle-orm';

// Helper to create a bookmark directly in DB
const createBookmark = async (data: Partial<Bookmark>) => {
  const [row] = await db
    .insert(bookmarks)
    .values({
      url: data.url ?? 'https://example.com',
      title: data.title ?? 'Example',
      description: data.description ?? null,
      user_id: data.user_id ?? null,
    })
    .returning()
    .execute();
  return row;
};

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no bookmarks exist', async () => {
    const result = await getBookmarks();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all bookmarks with correct fields', async () => {
    // Create a user to satisfy foreign key constraints
    const user = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
      })
      .returning()
      .execute()
      .then((rows) => rows[0]);

    // Insert two bookmarks with varying nullable fields
    const bm1 = await createBookmark({
      url: 'https://site1.com',
      title: 'Site 1',
      description: 'First site',
      user_id: user.id,
    });
    const bm2 = await createBookmark({
      url: 'https://site2.com',
      title: 'Site 2',
      // description omitted -> null
      // user_id omitted -> null
    });

    const results = await getBookmarks();
    expect(results).toHaveLength(2);

    // Verify first bookmark
    const fetched1 = results.find((b) => b.id === bm1.id);
    expect(fetched1).toBeDefined();
    expect(fetched1?.url).toBe('https://site1.com');
    expect(fetched1?.title).toBe('Site 1');
    expect(fetched1?.description).toBe('First site');
    expect(fetched1?.user_id).toBe(user.id);
    expect(fetched1?.created_at).toBeInstanceOf(Date);

    // Verify second bookmark (null fields)
    const fetched2 = results.find((b) => b.id === bm2.id);
    expect(fetched2).toBeDefined();
    expect(fetched2?.description).toBeNull();
    expect(fetched2?.user_id).toBeNull();
  });


  it('should reflect updates made directly in the database', async () => {
    const bm = await createBookmark({ url: 'https://orig.com', title: 'Original' });
    // Update title directly via DB
    await db.update(bookmarks).set({ title: 'Updated' }).where(eq(bookmarks.id, bm.id)).execute();

    const results = await getBookmarks();
    const updated = results.find((b) => b.id === bm.id);
    expect(updated?.title).toBe('Updated');
  });
});
