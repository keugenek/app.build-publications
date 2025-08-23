import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTag } from '../handlers/delete_tag';

/** Helper to create a tag and return its full record */
const createTag = async (name: string) => {
  const result = await db
    .insert(tags)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

describe('deleteTag handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing tag and return its data', async () => {
    const inserted = await createTag('Test Tag');
    const deleted = await deleteTag(inserted.id);

    // Verify returned tag matches inserted values
    expect(deleted.id).toBe(inserted.id);
    expect(deleted.name).toBe('Test Tag');
    expect(deleted.user_id).toBeNull();
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Verify tag no longer exists in DB
    const remaining = await db.select().from(tags).where(eq(tags.id, inserted.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent tag', async () => {
    await expect(deleteTag(9999)).rejects.toThrow(/not found/i);
  });
});
