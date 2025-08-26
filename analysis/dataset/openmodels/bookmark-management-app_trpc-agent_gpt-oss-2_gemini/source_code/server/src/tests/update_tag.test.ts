import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateTag } from '../handlers/update_tag';
import type { UpdateTagInput } from '../schema';

/** Helper to insert a tag directly into the DB and return its ID */
const insertTag = async (name: string) => {
  const result = await db
    .insert(tags)
    .values({ name, user_id: null })
    .returning()
    .execute();
  return result[0].id;
};

describe('updateTag handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates an existing tag and returns the updated record', async () => {
    const originalName = 'Original Tag';
    const tagId = await insertTag(originalName);

    const input: UpdateTagInput = {
      id: tagId,
      name: 'Updated Tag',
    };

    const updated = await updateTag(input);

    // Verify returned shape
    expect(updated.id).toBe(tagId);
    expect(updated.name).toBe('Updated Tag');
    expect(updated.user_id).toBeNull();
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify persisted changes
    const persisted = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .execute();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].name).toBe('Updated Tag');
  });

  it('throws an error when trying to update a non‑existent tag', async () => {
    const input: UpdateTagInput = {
      id: 9999, // assuming this ID does not exist
      name: 'Should Fail',
    };

    await expect(updateTag(input)).rejects.toThrow('Tag not found');
  });
});
