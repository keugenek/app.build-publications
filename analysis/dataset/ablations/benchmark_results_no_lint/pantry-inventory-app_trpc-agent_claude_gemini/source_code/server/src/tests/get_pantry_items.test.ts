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
  });

  it('should return all pantry items with correct field types', async () => {
    // Create test pantry items
    const testItems = [
      {
        name: 'Milk',
        quantity: '2.5',
        unit: 'liters',
        expiration_date: '2024-01-15',
        category: 'dairy',
        notes: 'Organic whole milk'
      },
      {
        name: 'Bread',
        quantity: '1',
        unit: 'loaf',
        expiration_date: '2024-01-10',
        category: 'bakery',
        notes: null
      }
    ];

    await db.insert(pantryItemsTable).values(testItems).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(2);
    
    // Check field types and values
    result.forEach(item => {
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.quantity).toBe('number'); // Should be converted from string
      expect(typeof item.unit).toBe('string');
      expect(item.expiration_date).toBeInstanceOf(Date);
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });

    // Check specific values
    const milk = result.find(item => item.name === 'Milk');
    expect(milk).toBeDefined();
    expect(milk!.quantity).toBe(2.5);
    expect(milk!.unit).toBe('liters');
    expect(milk!.category).toBe('dairy');
    expect(milk!.notes).toBe('Organic whole milk');

    const bread = result.find(item => item.name === 'Bread');
    expect(bread).toBeDefined();
    expect(bread!.quantity).toBe(1);
    expect(bread!.unit).toBe('loaf');
    expect(bread!.category).toBe('bakery');
    expect(bread!.notes).toBe(null);
  });

  it('should return items ordered by expiration date then by name', async () => {
    // Create items with different expiration dates
    const testItems = [
      {
        name: 'Zucchini',
        quantity: '3',
        unit: 'pieces',
        expiration_date: '2024-01-20', // Latest expiration
        category: 'vegetables',
        notes: null
      },
      {
        name: 'Carrots',
        quantity: '1.5',
        unit: 'lbs',
        expiration_date: '2024-01-10', // Earliest expiration
        category: 'vegetables',
        notes: null
      },
      {
        name: 'Apples',
        quantity: '2',
        unit: 'lbs',
        expiration_date: '2024-01-10', // Same expiration as carrots
        category: 'fruits',
        notes: null
      },
      {
        name: 'Cheese',
        quantity: '0.5',
        unit: 'lbs',
        expiration_date: '2024-01-15', // Middle expiration
        category: 'dairy',
        notes: null
      }
    ];

    await db.insert(pantryItemsTable).values(testItems).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(4);
    
    // Check ordering: expiration date ascending, then name ascending
    expect(result[0].name).toBe('Apples'); // 2024-01-10, comes before Carrots alphabetically
    expect(result[1].name).toBe('Carrots'); // 2024-01-10, comes after Apples alphabetically
    expect(result[2].name).toBe('Cheese'); // 2024-01-15
    expect(result[3].name).toBe('Zucchini'); // 2024-01-20

    // Verify expiration dates are in ascending order
    const expirationDates = result.map(item => item.expiration_date.getTime());
    for (let i = 1; i < expirationDates.length; i++) {
      expect(expirationDates[i]).toBeGreaterThanOrEqual(expirationDates[i - 1]);
    }
  });

  it('should handle various quantity formats correctly', async () => {
    const testItems = [
      {
        name: 'Flour',
        quantity: '5.25', // Decimal quantity
        unit: 'lbs',
        expiration_date: '2024-06-01',
        category: 'baking',
        notes: null
      },
      {
        name: 'Eggs',
        quantity: '12', // Whole number quantity
        unit: 'pieces',
        expiration_date: '2024-01-20',
        category: 'dairy',
        notes: null
      },
      {
        name: 'Vanilla Extract',
        quantity: '0.5', // Small decimal
        unit: 'oz',
        expiration_date: '2025-01-01',
        category: 'baking',
        notes: null
      }
    ];

    await db.insert(pantryItemsTable).values(testItems).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(3);
    
    const flour = result.find(item => item.name === 'Flour');
    expect(flour!.quantity).toBe(5.25);

    const eggs = result.find(item => item.name === 'Eggs');
    expect(eggs!.quantity).toBe(12);

    const vanilla = result.find(item => item.name === 'Vanilla Extract');
    expect(vanilla!.quantity).toBe(0.5);
  });

  it('should handle null category and notes fields', async () => {
    const testItems = [
      {
        name: 'Mystery Item',
        quantity: '1',
        unit: 'piece',
        expiration_date: '2024-01-15',
        category: null, // Explicitly null
        notes: null // Explicitly null
      },
      {
        name: 'Labeled Item',
        quantity: '2',
        unit: 'pieces',
        expiration_date: '2024-01-16',
        category: 'test',
        notes: 'Has category and notes'
      }
    ];

    await db.insert(pantryItemsTable).values(testItems).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(2);
    
    const mysteryItem = result.find(item => item.name === 'Mystery Item');
    expect(mysteryItem!.category).toBe(null);
    expect(mysteryItem!.notes).toBe(null);

    const labeledItem = result.find(item => item.name === 'Labeled Item');
    expect(labeledItem!.category).toBe('test');
    expect(labeledItem!.notes).toBe('Has category and notes');
  });
});
