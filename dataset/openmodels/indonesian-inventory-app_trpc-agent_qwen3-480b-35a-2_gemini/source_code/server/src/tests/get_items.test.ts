import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type CreateItemInput } from '../schema';
import { getItems } from '../handlers/get_items';
import { eq } from 'drizzle-orm';

// Test inputs
const testItem1: CreateItemInput = {
  name: 'Test Item 1',
  code: 'TI001',
  description: 'First test item',
  stock: 50
};

const testItem2: CreateItemInput = {
  name: 'Test Item 2',
  code: 'TI002',
  description: 'Second test item',
  stock: 100
};

describe('getItems', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test items
    await db.insert(itemsTable).values(testItem1).execute();
    await db.insert(itemsTable).values(testItem2).execute();
  });
  
  afterEach(resetDB);

  it('should return all items', async () => {
    const results = await getItems();

    expect(results).toHaveLength(2);
    
    // Check first item
    const item1 = results.find(item => item.name === 'Test Item 1');
    expect(item1).toBeDefined();
    expect(item1?.code).toEqual('TI001');
    expect(item1?.description).toEqual('First test item');
    expect(item1?.stock).toEqual(50);
    expect(item1?.id).toBeDefined();
    expect(item1?.created_at).toBeInstanceOf(Date);
    expect(item1?.updated_at).toBeInstanceOf(Date);
    
    // Check second item
    const item2 = results.find(item => item.name === 'Test Item 2');
    expect(item2).toBeDefined();
    expect(item2?.code).toEqual('TI002');
    expect(item2?.description).toEqual('Second test item');
    expect(item2?.stock).toEqual(100);
    expect(item2?.id).toBeDefined();
    expect(item2?.created_at).toBeInstanceOf(Date);
    expect(item2?.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no items exist', async () => {
    // Clear all items
    await db.delete(itemsTable).execute();
    
    const results = await getItems();
    expect(results).toHaveLength(0);
  });

  it('should handle items with null descriptions', async () => {
    // Insert item with null description
    const itemWithNullDesc: CreateItemInput = {
      name: 'Item with null desc',
      code: 'TI003',
      description: null,
      stock: 25
    };
    
    await db.insert(itemsTable).values(itemWithNullDesc).execute();
    
    const results = await getItems();
    expect(results).toHaveLength(3);
    
    const itemWithNull = results.find(item => item.name === 'Item with null desc');
    expect(itemWithNull).toBeDefined();
    expect(itemWithNull?.description).toBeNull();
    expect(itemWithNull?.stock).toEqual(25);
  });
});
