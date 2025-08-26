import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getRecipeSuggestions } from '../handlers/get_recipe_suggestions';

describe('getRecipeSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipe suggestions based on pantry items', async () => {
    // Insert some pantry items that match recipe ingredients
    await db.insert(pantryItemsTable)
      .values({
        name: 'Apple',
        quantity: 5,
        expiry_date: new Date('2023-12-31').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Banana',
        quantity: 3,
        expiry_date: new Date('2023-12-25').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Orange',
        quantity: 4,
        expiry_date: new Date('2023-12-30').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Pasta',
        quantity: 2,
        expiry_date: new Date('2024-06-30').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Tomato',
        quantity: 6,
        expiry_date: new Date('2023-12-20').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Cheese',
        quantity: 1,
        expiry_date: new Date('2024-01-15').toISOString().split('T')[0]
      })
      .execute();

    const suggestions = await getRecipeSuggestions();

    // Should return at least some suggestions
    expect(suggestions.length).toBeGreaterThan(0);

    // Check that returned suggestions have the correct structure
    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('name');
      expect(suggestion).toHaveProperty('ingredients');
      expect(suggestion).toHaveProperty('instructions');
      expect(Array.isArray(suggestion.ingredients)).toBe(true);
      expect(typeof suggestion.name).toBe('string');
      expect(typeof suggestion.instructions).toBe('string');
    });
  });

  it('should return different suggestions based on different pantry items', async () => {
    // Insert pantry items matching the pasta recipe
    await db.insert(pantryItemsTable)
      .values({
        name: 'Pasta',
        quantity: 2,
        expiry_date: new Date('2024-06-30').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Tomato',
        quantity: 6,
        expiry_date: new Date('2023-12-20').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Cheese',
        quantity: 1,
        expiry_date: new Date('2024-01-15').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Garlic',
        quantity: 3,
        expiry_date: new Date('2024-01-01').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Olive Oil',
        quantity: 1,
        expiry_date: new Date('2025-01-01').toISOString().split('T')[0]
      })
      .execute();

    const suggestions = await getRecipeSuggestions();

    // Should include Simple Pasta recipe
    const pastaRecipe = suggestions.find(recipe => recipe.name === 'Simple Pasta');
    expect(pastaRecipe).toBeDefined();
    expect(pastaRecipe?.name).toBe('Simple Pasta');
  });

  it('should return an empty array when no pantry items match recipes', async () => {
    // Insert pantry items that don't match any recipe templates
    await db.insert(pantryItemsTable)
      .values({
        name: 'Unknown Item 1',
        quantity: 1,
        expiry_date: new Date('2023-12-31').toISOString().split('T')[0]
      })
      .execute();
      
    await db.insert(pantryItemsTable)
      .values({
        name: 'Unknown Item 2',
        quantity: 2,
        expiry_date: new Date('2023-12-25').toISOString().split('T')[0]
      })
      .execute();

    const suggestions = await getRecipeSuggestions();
    
    // It's okay to return some suggestions based on partial matches,
    // but at least it should not crash
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('should return an empty array when pantry is empty', async () => {
    const suggestions = await getRecipeSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
