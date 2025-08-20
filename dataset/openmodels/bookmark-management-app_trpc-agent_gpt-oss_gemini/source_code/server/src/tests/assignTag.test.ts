import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { type CreateTagInput } from '../schema';
import { type AssignTagInput } from '../schema';
import { assignTag } from '../handlers/assignTag';
import { eq } from 'drizzle-orm';

// Helper to create a user for foreign key constraints
const createUser = async () => {
  const result = await db.insert(usersTable).values({
    email: 'test@example.com',
    password_hash: 'hashed',
  }).returning().execute();
  return result[0];
};

// Helper to create a bookmark
const createBookmark = async (userId: number, input?: Partial<CreateBookmarkInput>) => {
  const bookmark = await db.insert(bookmarksTable).values({
    user_id: userId,
    url: 'https://example.com',
    title: 'Example',
    description: 'Desc',
    collection_id: null,
    ...input,
  }).returning().execute();
  return bookmark[0];
};

// Helper to create a tag
const createTag = async (userId: number, input?: Partial<CreateTagInput>) => {
  const tag = await db.insert(tagsTable).values({
    user_id: userId,
    name: 'test-tag',
    ...input,
  }).returning().execute();
  return tag[0];
};

describe('assignTag handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a row into bookmark_tags', async () => {
    const user = await createUser();
    const bookmark = await createBookmark(user.id);
    const tag = await createTag(user.id);
    const input: AssignTagInput = { bookmark_id: bookmark.id, tag_id: tag.id };

    const result = await assignTag(input);
    expect(result.success).toBe(true);

    // Verify row exists
    const rows = await db.select().from(bookmarkTagsTable).where(eq(bookmarkTagsTable.bookmark_id, bookmark.id)).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].tag_id).toBe(tag.id);
  });
});
