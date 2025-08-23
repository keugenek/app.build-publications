import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type CreateItemInput } from '../schema';
import { createItem } from '../handlers/create_item';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateItemInput = {
  name: 'Test Item',
  code: 'TEST001',
  description: 'A test item',
  stock: 10
};

describe('createItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an item', async () => {
    const result = await createItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Item');
    expect(result.code).toEqual('TEST001');
    expect(result.description).toEqual('A test item');
    expect(result.stock).toEqual(10);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save item to database', async () => {
    const result = await createItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Test Item');
    expect(items[0].code).toEqual('TEST001');
    expect(items[0].description).toEqual('A test item');
    expect(items[0].stock).toEqual(10);
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle item with null description', async () => {
    const inputWithNullDescription: CreateItemInput = {
      name: 'Item with null description',
      code: 'NULL001',
      description: null,
      stock: 5
    };

    const result = await createItem(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Item with null description');
    expect(result.code).toEqual('NULL001');
    expect(result.stock).toEqual(5);
  });

  it('should use default stock value when not provided', async () => {
    const inputWithoutStock: CreateItemInput = {
      name: 'Item without stock',
      code: 'NOSTOCK001',
      description: 'An item without stock specified',
      stock: 0 // Default value applied by Zod
    };

    const result = await createItem(inputWithoutStock);

    expect(result.name).toEqual('Item without stock');
    expect(result.code).toEqual('NOSTOCK001');
    expect(result.description).toEqual('An item without stock specified');
    expect(result.stock).toEqual(0); // Default value
  });
});
