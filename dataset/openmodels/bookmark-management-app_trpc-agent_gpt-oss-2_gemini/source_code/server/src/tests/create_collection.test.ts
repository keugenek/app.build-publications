import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { collections } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';

const testInput: CreateCollectionInput = {
  name: 'Test Collection',
};

describe('createCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a collection and return proper fields', async () => {
    const result = await createCollection(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Collection');
    expect(result.user_id).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the collection in the database', async () => {
    const result = await createCollection(testInput);

    const fetched = await db.select()
      .from(collections)
      .where(eq(collections.id, result.id))
      .execute();

    expect(fetched).toHaveLength(1);
    const row = fetched[0];
    expect(row.name).toBe('Test Collection');
    expect(row.user_id).toBeNull();
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
