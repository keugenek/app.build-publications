import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { collections } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCollectionInput } from '../schema';
import { updateCollection } from '../handlers/update_collection';

describe('updateCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update the collection name and return the updated collection', async () => {
    // Insert initial collection directly into DB
    const [inserted] = await db
      .insert(collections)
      .values({ name: 'Original Collection' })
      .returning()
      .execute();

    const input: UpdateCollectionInput = {
      id: inserted.id,
      name: 'Updated Collection',
    };

    const updated = await updateCollection(input);

    // Verify the returned object
    expect(updated.id).toBe(inserted.id);
    expect(updated.name).toBe('Updated Collection');
    // user_id should be null (default) as we didn't set it
    expect(updated.user_id).toBeNull();
    expect(updated.created_at).toBeInstanceOf(Date);
  });

  it('should persist the updated name in the database', async () => {
    const [inserted] = await db
      .insert(collections)
      .values({ name: 'Another Collection' })
      .returning()
      .execute();

    const input: UpdateCollectionInput = {
      id: inserted.id,
      name: 'Persisted Update',
    };

    await updateCollection(input);

    const result = await db
      .select()
      .from(collections)
      .where(eq(collections.id, inserted.id))
      .execute();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Persisted Update');
  });

  it('should throw an error when the collection does not exist', async () => {
    const input: UpdateCollectionInput = {
      id: 9999, // assuming this ID does not exist
      name: 'Nonexistent',
    };

    await expect(updateCollection(input)).rejects.toThrow(/not found/i);
  });
});
