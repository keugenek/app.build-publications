import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getPantryItems } from '../handlers/get_pantry_items';

describe('getPantryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pantry items exist', async () => {
    const result = await getPantryItems();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all pantry items with correct data types', async () => {
    // Create test data
    await db.insert(pantryItemsTable).values([
      {
        name: 'Milk',
        quantity: '2.5', // Stored as string
        expiry_date: '2024-01-15'
      },
      {
        name: 'Bread',
        quantity: '1.0', // Stored as string
        expiry_date: '2024-01-10'
      }
    ]).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(2);
    
    // Verify data types and content
    result.forEach(item => {
      expect(item.id).toBeDefined();
      expect(typeof item.name).toBe('string');
      expect(typeof item.quantity).toBe('number'); // Should be converted to number
      expect(item.expiry_date).toBeInstanceOf(Date);
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific values
    const milk = result.find(item => item.name === 'Milk');
    const bread = result.find(item => item.name === 'Bread');
    
    expect(milk).toBeDefined();
    expect(milk!.quantity).toBe(2.5);
    expect(bread).toBeDefined();
    expect(bread!.quantity).toBe(1.0);
  });

  it('should return items ordered by name first, then by expiry date', async () => {
    // Create test data with same name but different expiry dates
    await db.insert(pantryItemsTable).values([
      {
        name: 'Yogurt',
        quantity: '1.0',
        expiry_date: '2024-01-20' // Later expiry
      },
      {
        name: 'Apples',
        quantity: '5.0',
        expiry_date: '2024-01-10'
      },
      {
        name: 'Yogurt',
        quantity: '2.0',
        expiry_date: '2024-01-15' // Earlier expiry
      },
      {
        name: 'Bananas',
        quantity: '3.0',
        expiry_date: '2024-01-12'
      }
    ]).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(4);
    
    // Verify ordering: Apples -> Bananas -> Yogurt (early) -> Yogurt (late)
    expect(result[0].name).toBe('Apples');
    expect(result[1].name).toBe('Bananas');
    expect(result[2].name).toBe('Yogurt');
    expect(result[2].expiry_date.getTime()).toBeLessThan(result[3].expiry_date.getTime());
    expect(result[3].name).toBe('Yogurt');
  });

  it('should handle different quantity formats correctly', async () => {
    // Test various numeric formats
    await db.insert(pantryItemsTable).values([
      {
        name: 'Item A',
        quantity: '10', // Whole number
        expiry_date: '2024-01-15'
      },
      {
        name: 'Item B',
        quantity: '3.14', // Decimal (limited by schema precision)
        expiry_date: '2024-01-15'
      },
      {
        name: 'Item C',
        quantity: '0.5', // Less than 1
        expiry_date: '2024-01-15'
      }
    ]).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(3);
    
    const itemA = result.find(item => item.name === 'Item A');
    const itemB = result.find(item => item.name === 'Item B');
    const itemC = result.find(item => item.name === 'Item C');
    
    expect(itemA!.quantity).toBe(10);
    expect(itemB!.quantity).toBe(3.14); // Schema has scale 2, so only 2 decimal places
    expect(itemC!.quantity).toBe(0.5);
    
    // Ensure all quantities are numbers
    result.forEach(item => {
      expect(typeof item.quantity).toBe('number');
    });
  });

  it('should handle date conversion correctly', async () => {
    const testDate = '2024-06-15';
    
    await db.insert(pantryItemsTable).values({
      name: 'Test Item',
      quantity: '1.0',
      expiry_date: testDate
    }).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(1);
    expect(result[0].expiry_date).toBeInstanceOf(Date);
    expect(result[0].expiry_date.toISOString().split('T')[0]).toBe(testDate);
  });

  it('should verify database persistence', async () => {
    // Insert item and verify it persists
    const insertResult = await db.insert(pantryItemsTable).values({
      name: 'Persistent Item',
      quantity: '7.25',
      expiry_date: '2024-12-31'
    }).returning().execute();

    const handlerResult = await getPantryItems();

    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].id).toBe(insertResult[0].id);
    expect(handlerResult[0].name).toBe('Persistent Item');
    expect(handlerResult[0].quantity).toBe(7.25);
    expect(handlerResult[0].expiry_date.toISOString().split('T')[0]).toBe('2024-12-31');
  });
});
