import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { collections } from '../db/schema';
import { getCollections } from '../handlers/get_collections';
import { eq } from 'drizzle-orm';

describe('getCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no collections exist', async () => {
    const result = await getCollections();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all collections from the database', async () => {
    // Insert sample collections
    const inserted = await db.insert(collections)
      .values([
        { name: 'Work' },
        { name: 'Personal' },
      ])
      .returning()
      .execute();

    const result = await getCollections();
    expect(result).toHaveLength(2);
    // Ensure each returned collection matches an inserted one
    const names = result.map((c) => c.name).sort();
    expect(names).toEqual(['Personal', 'Work']);
    // Verify fields are present and correctly typed
    result.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(typeof c.id).toBe('number');
      expect(c.created_at).toBeInstanceOf(Date);
    });
    // Optionally verify IDs match inserted IDs
    const insertedIds = inserted.map((i) => i.id).sort();
    const resultIds = result.map((c) => c.id).sort();
    expect(resultIds).toEqual(insertedIds);
  });
});
