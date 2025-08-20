import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection, getCollections } from '../handlers/collection';
import { eq } from 'drizzle-orm';

// Helper to create a user for FK constraints
const createTestUser = async () => {
  const result = await db
    .insert(usersTable)
    .values({
      email: 'testuser@example.com',
      password_hash: 'hashedpassword',
    })
    .returning()
    .execute();
  return result[0];
};

describe('Collection Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a collection and return correct fields', async () => {
    const user = await createTestUser();
    const input: CreateCollectionInput = {
      user_id: user.id,
      name: 'My Collection',
      description: 'A test collection',
    };

    const collection = await createCollection(input);

    expect(collection.id).toBeDefined();
    expect(collection.user_id).toBe(user.id);
    expect(collection.name).toBe('My Collection');
    expect(collection.description).toBe('A test collection');
    expect(collection.created_at).toBeInstanceOf(Date);
  });

  it('should retrieve all collections from the database', async () => {
    const user = await createTestUser();
    const inputs: CreateCollectionInput[] = [
      { user_id: user.id, name: 'First', description: null },
      { user_id: user.id, name: 'Second', description: 'Second collection' },
    ];

    // Create collections via handler
    const created = await Promise.all(inputs.map((i) => createCollection(i)));

    const collections = await getCollections();

    // Ensure we have at least the two created collections
    const ids = created.map((c) => c.id);
    const fetchedIds = collections.map((c) => c.id);
    ids.forEach((id) => {
      expect(fetchedIds).toContain(id);
    });

    // Verify database rows directly
    const dbRows = await db.select().from(collectionsTable).where(eq(collectionsTable.user_id, user.id)).execute();
    expect(dbRows.length).toBe(2);
    dbRows.forEach((row) => {
      const match = created.find((c) => c.id === row.id);
      expect(match).toBeDefined();
      const found = match as NonNullable<typeof match>;
      expect(row.name).toBe(found.name);
      expect(row.description).toBe(found.description);
    });
    
  });
});
