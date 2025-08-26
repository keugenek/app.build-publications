import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tables } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';
import { createTag, getTags } from '../handlers/tag';
import { eq } from 'drizzle-orm';

// Helper to create a user for tag foreign key
const createTestUser = async () => {
  const result = await db
    .insert(tables.users)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed', // placeholder hash
    })
    .returning()
    .execute();
  return result[0];
};

describe('Tag handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag', async () => {
    const user = await createTestUser();
    const input: CreateTagInput = {
      user_id: user.id,
      name: 'Important',
    };

    const tag = await createTag(input);

    expect(tag.id).toBeDefined();
    expect(tag.user_id).toBe(user.id);
    expect(tag.name).toBe('Important');
    expect(tag.created_at).toBeInstanceOf(Date);
  });

  it('should fetch tags from database', async () => {
    const user = await createTestUser();
    const input: CreateTagInput = {
      user_id: user.id,
      name: 'Work',
    };
    const createdTag = await createTag(input);

    const tags = await getTags();
    // Find the created tag in the returned array
    const fetched = tags.find(t => t.id === createdTag.id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Work');
    expect(fetched?.user_id).toBe(user.id);
    expect(fetched?.created_at).toBeInstanceOf(Date);

    // Also verify directly via query
    const dbTag = await db
      .select()
      .from(tables.tags)
      .where(eq(tables.tags.id, createdTag.id))
      .execute();
    expect(dbTag).toHaveLength(1);
    expect(dbTag[0].name).toBe('Work');
  });
});
