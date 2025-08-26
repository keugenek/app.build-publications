import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tags } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag',
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag and return proper fields', async () => {
    const result = await createTag(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toEqual('Test Tag');
    expect(result.created_at).toBeInstanceOf(Date);
    // user_id is nullable; since we didn't set, should be null
    expect(result.user_id).toBeNull();
  });

  it('should persist the tag in the database', async () => {
    const result = await createTag(testInput);

    const rows = await db.select()
      .from(tags)
      .where(eq(tags.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const saved = rows[0];
    expect(saved.name).toEqual('Test Tag');
    expect(saved.user_id).toBeNull();
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
