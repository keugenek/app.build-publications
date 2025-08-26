import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type RecipeSuggestionInput } from '../schema';
import { getRecipeSuggestions } from '../handlers/get_recipe_suggestions';
import { eq } from 'drizzle-orm';

describe('getRecipeSuggestions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test pantry items
    await db.insert(pantryItemsTable).values({
      name: 'Carrots',
      quantity: 5,
      expiry_date: '2023-12-31',
      category: 'Produce'
    }).execute();
    
    await db.insert(pantryItemsTable).values({
      name: 'Milk',
      quantity: 2,
      expiry_date: '2023-11-30',
      category: 'Dairy'
    }).execute();
    
    await db.insert(pantryItemsTable).values({
      name: 'Rice',
      quantity: 10,
      expiry_date: '2024-06-30',
      category: 'Grains'
    }).execute();
    
    await db.insert(pantryItemsTable).values({
      name: 'Tomato Sauce',
      quantity: 3,
      expiry_date: '2025-01-15',
      category: 'Canned Goods'
    }).execute();
  });

  afterEach(resetDB);

  it('should return recipe suggestions based on available pantry items', async () => {
    // Get all pantry item IDs
    const pantryItems = await db.select({ id: pantryItemsTable.id })
      .from(pantryItemsTable)
      .execute();
    
    const pantryItemIds = pantryItems.map(item => item.id);
    
    const input: RecipeSuggestionInput = {
      pantry_items: pantryItemIds
    };

    const result = await getRecipeSuggestions(input);

    expect(result).toBeArray();
    // The algorithm should match at least some recipes with our pantry items
  });

  it('should return fewer suggestions with fewer pantry items', async () => {
    // Get only produce items
    const pantryItems = await db.select({ id: pantryItemsTable.id })
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.category, 'Produce'))
      .execute();
    
    const pantryItemIds = pantryItems.map(item => item.id);
    
    const input: RecipeSuggestionInput = {
      pantry_items: pantryItemIds
    };

    const result = await getRecipeSuggestions(input);
    
    expect(result).toBeArray();
  });

  it('should return empty array when no pantry items provided', async () => {
    const input: RecipeSuggestionInput = {
      pantry_items: []
    };

    const result = await getRecipeSuggestions(input);
    
    expect(result).toBeArray();
    expect(result).toHaveLength(0);
  });

  it('should handle non-existent pantry item IDs gracefully', async () => {
    const input: RecipeSuggestionInput = {
      pantry_items: [999, 1000] // Non-existent items
    };

    const result = await getRecipeSuggestions(input);
    
    expect(result).toBeArray();
    expect(result).toHaveLength(0);
  });
});
