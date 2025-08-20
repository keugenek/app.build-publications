import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getAllPantryItems } from '../handlers/get_all_pantry_items';

describe('getAllPantryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getAllPantryItems();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all pantry items with correct data types', async () => {
    // Create test data
    const testItems = [
      {
        name: 'Apples',
        quantity: 5.5,
        expiry_date: '2024-12-25'
      },
      {
        name: 'Bread',
        quantity: 2,
        expiry_date: '2024-12-20'
      }
    ];

    await db.insert(pantryItemsTable)
      .values(testItems)
      .execute();

    const result = await getAllPantryItems();

    expect(result).toHaveLength(2);
    
    // Check data types and values
    result.forEach(item => {
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.quantity).toBe('number'); // Should be converted from string
      expect(item.expiry_date).toBeInstanceOf(Date);
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific values
    const breadItem = result.find(item => item.name === 'Bread');
    const applesItem = result.find(item => item.name === 'Apples');
    
    expect(breadItem?.quantity).toBe(2);
    expect(applesItem?.quantity).toBe(5.5);
  });

  it('should return items ordered by expiry date (soonest first)', async () => {
    // Create test items with different expiry dates
    const testItems = [
      {
        name: 'Item C',
        quantity: 3,
        expiry_date: '2024-12-30' // Latest expiry
      },
      {
        name: 'Item A',
        quantity: 1,
        expiry_date: '2024-12-15' // Earliest expiry
      },
      {
        name: 'Item B', 
        quantity: 2,
        expiry_date: '2024-12-20' // Middle expiry
      }
    ];

    await db.insert(pantryItemsTable)
      .values(testItems)
      .execute();

    const result = await getAllPantryItems();

    expect(result).toHaveLength(3);
    
    // Verify ordering by expiry date (soonest first)
    expect(result[0].name).toBe('Item A'); // 2024-12-15
    expect(result[1].name).toBe('Item B'); // 2024-12-20
    expect(result[2].name).toBe('Item C'); // 2024-12-30
    
    // Verify dates are in ascending order
    expect(result[0].expiry_date.getTime()).toBeLessThan(result[1].expiry_date.getTime());
    expect(result[1].expiry_date.getTime()).toBeLessThan(result[2].expiry_date.getTime());
  });

  it('should handle items with same expiry date consistently', async () => {
    // Create items with identical expiry dates
    const sameExpiryDate = '2024-12-25';
    const testItems = [
      {
        name: 'Milk',
        quantity: 1,
        expiry_date: sameExpiryDate
      },
      {
        name: 'Yogurt',
        quantity: 2,
        expiry_date: sameExpiryDate
      },
      {
        name: 'Cheese',
        quantity: 0.5,
        expiry_date: sameExpiryDate
      }
    ];

    await db.insert(pantryItemsTable)
      .values(testItems)
      .execute();

    const result = await getAllPantryItems();

    expect(result).toHaveLength(3);
    
    // All items should have the same expiry date
    result.forEach(item => {
      expect(item.expiry_date.toISOString().split('T')[0]).toBe(sameExpiryDate);
    });
    
    // Verify all expected items are present
    const itemNames = result.map(item => item.name).sort();
    expect(itemNames).toEqual(['Cheese', 'Milk', 'Yogurt']);
  });

  it('should handle large quantities with decimal precision', async () => {
    // Test with various quantity formats
    const testItems = [
      {
        name: 'Rice',
        quantity: 25.75, // Decimal quantity
        expiry_date: '2024-12-30'
      },
      {
        name: 'Flour',
        quantity: 10, // Whole number
        expiry_date: '2024-12-25'
      }
    ];

    await db.insert(pantryItemsTable)
      .values(testItems)
      .execute();

    const result = await getAllPantryItems();

    expect(result).toHaveLength(2);
    
    const riceItem = result.find(item => item.name === 'Rice');
    const flourItem = result.find(item => item.name === 'Flour');
    
    expect(riceItem?.quantity).toBe(25.75);
    expect(flourItem?.quantity).toBe(10);
    expect(typeof riceItem?.quantity).toBe('number');
    expect(typeof flourItem?.quantity).toBe('number');
  });
});
