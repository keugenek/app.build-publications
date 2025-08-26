import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collections } from '../db/schema';

// import { createCollection } from '../handlers/create_collection';
import { deleteCollection } from '../handlers/delete_collection';
import { eq } from 'drizzle-orm';

describe('deleteCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing collection and return it', async () => {
    // Insert a collection directly into the database
    const insertResult = await db
      .insert(collections)
      .values({ name: 'Test Collection' })
      .returning()
      .execute();
    const created = insertResult[0];
    
    

    // Delete the collection
    const deleted = await deleteCollection(created.id);

    expect(deleted.id).toBe(created.id);
    expect(deleted.name).toBe('Test Collection');

    // Verify it no longer exists in DB
    const remaining = await db
      .select()
      .from(collections)
      .where(eq(collections.id, created.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when collection does not exist', async () => {
    await expect(deleteCollection(9999)).rejects.toThrow(/not found/i);
  });
});
