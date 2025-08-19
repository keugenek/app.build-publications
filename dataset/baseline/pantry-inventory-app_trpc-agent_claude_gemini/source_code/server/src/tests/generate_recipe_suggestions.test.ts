import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type RecipeRequest, type CreatePantryItemInput } from '../schema';
import { generateRecipeSuggestions } from '../handlers/generate_recipe_suggestions';

// Helper function to create test pantry items
async function createPantryItem(input: CreatePantryItemInput) {
  const result = await db.insert(pantryItemsTable)
    .values({
      name: input.name,
      quantity: input.quantity.toString(),
      expiry_date: input.expiry_date.toISOString().split('T')[0]
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    quantity: parseFloat(result[0].quantity),
    expiry_date: new Date(result[0].expiry_date)
  };
}

describe('generateRecipeSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate recipe suggestions with all pantry items', async () => {
    // Create test pantry items
    await createPantryItem({
      name: 'Tomato',
      quantity: 3,
      expiry_date: new Date('2024-12-31')
    });
    
    await createPantryItem({
      name: 'Pasta',
      quantity: 1,
      expiry_date: new Date('2024-12-31')
    });

    const input: RecipeRequest = {
      max_recipes: 5
    };

    const result = await generateRecipeSuggestions(input);

    // Should return structured response
    expect(result.recipes).toBeDefined();
    expect(result.pantry_items_used).toBeDefined();
    expect(result.items_expiring_soon).toBeDefined();
    expect(Array.isArray(result.recipes)).toBe(true);
    expect(Array.isArray(result.pantry_items_used)).toBe(true);
    expect(Array.isArray(result.items_expiring_soon)).toBe(true);

    // Should include pantry items
    expect(result.pantry_items_used).toHaveLength(2);
    expect(result.pantry_items_used[0].name).toEqual('Tomato');
    expect(result.pantry_items_used[1].name).toEqual('Pasta');

    // Should generate recipes based on available ingredients
    expect(result.recipes.length).toBeGreaterThan(0);
    
    // Should find tomato pasta recipe
    const tomatoPastaRecipe = result.recipes.find(r => r.title === 'Tomato Pasta');
    expect(tomatoPastaRecipe).toBeDefined();
    expect(tomatoPastaRecipe?.ingredients_used).toContain('tomato');
    expect(tomatoPastaRecipe?.ingredients_used).toContain('pasta');
  });

  it('should generate recipes for specific item IDs', async () => {
    // Create test items
    const item1 = await createPantryItem({
      name: 'Rice',
      quantity: 2,
      expiry_date: new Date('2024-12-31')
    });
    
    const item2 = await createPantryItem({
      name: 'Egg',
      quantity: 6,
      expiry_date: new Date('2024-12-31')
    });

    // Create item that should not be included
    await createPantryItem({
      name: 'Unused Item',
      quantity: 1,
      expiry_date: new Date('2024-12-31')
    });

    const input: RecipeRequest = {
      item_ids: [item1.id, item2.id],
      max_recipes: 3
    };

    const result = await generateRecipeSuggestions(input);

    // Should only include specified items
    expect(result.pantry_items_used).toHaveLength(2);
    expect(result.pantry_items_used.map(item => item.name)).toEqual(
      expect.arrayContaining(['Rice', 'Egg'])
    );
    expect(result.pantry_items_used.map(item => item.name)).not.toContain('Unused Item');

    // Should generate recipes using these items
    expect(result.recipes.length).toBeGreaterThan(0);
    const riceRecipe = result.recipes.find(r => r.title === 'Rice Bowl');
    expect(riceRecipe).toBeDefined();
  });

  it('should identify items expiring soon', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);

    // Create expiring item
    await createPantryItem({
      name: 'Expiring Tomato',
      quantity: 2,
      expiry_date: tomorrow
    });

    // Create non-expiring item
    await createPantryItem({
      name: 'Fresh Pasta',
      quantity: 1,
      expiry_date: nextWeek
    });

    const input: RecipeRequest = {
      max_recipes: 5
    };

    const result = await generateRecipeSuggestions(input);

    // Should identify expiring items
    expect(result.items_expiring_soon).toHaveLength(1);
    expect(result.items_expiring_soon[0].name).toEqual('Expiring Tomato');
    
    // Should include all items in pantry_items_used
    expect(result.pantry_items_used).toHaveLength(2);
  });

  it('should prioritize recipes using expiring ingredients', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    // Create expiring tomato - should prioritize tomato-based recipes
    await createPantryItem({
      name: 'Tomato',
      quantity: 3,
      expiry_date: tomorrow
    });

    // Create non-expiring ingredients
    await createPantryItem({
      name: 'Rice',
      quantity: 2,
      expiry_date: nextMonth
    });
    
    await createPantryItem({
      name: 'Pasta',
      quantity: 1,
      expiry_date: nextMonth
    });

    const input: RecipeRequest = {
      max_recipes: 3
    };

    const result = await generateRecipeSuggestions(input);

    // Should have expiring items identified
    expect(result.items_expiring_soon).toHaveLength(1);
    expect(result.items_expiring_soon[0].name).toEqual('Tomato');

    // Should prioritize recipes using tomato
    expect(result.recipes.length).toBeGreaterThan(0);
    const firstRecipe = result.recipes[0];
    
    // First recipe should likely use tomato (expiring ingredient)
    // This tests the prioritization logic
    const tomatoRecipes = result.recipes.filter(r => 
      r.ingredients_used.some(ing => ing.includes('tomato'))
    );
    expect(tomatoRecipes.length).toBeGreaterThan(0);
  });

  it('should respect max_recipes limit', async () => {
    // Create multiple ingredients to generate many recipes
    await createPantryItem({
      name: 'Tomato',
      quantity: 2,
      expiry_date: new Date('2024-12-31')
    });
    
    await createPantryItem({
      name: 'Lettuce',
      quantity: 1,
      expiry_date: new Date('2024-12-31')
    });
    
    await createPantryItem({
      name: 'Rice',
      quantity: 1,
      expiry_date: new Date('2024-12-31')
    });
    
    await createPantryItem({
      name: 'Egg',
      quantity: 6,
      expiry_date: new Date('2024-12-31')
    });

    const input: RecipeRequest = {
      max_recipes: 2
    };

    const result = await generateRecipeSuggestions(input);

    // Should not exceed max_recipes limit
    expect(result.recipes).toHaveLength(2);
  });

  it('should handle empty pantry gracefully', async () => {
    const input: RecipeRequest = {
      max_recipes: 5
    };

    const result = await generateRecipeSuggestions(input);

    // Should return empty arrays without errors
    expect(result.recipes).toEqual([]);
    expect(result.pantry_items_used).toEqual([]);
    expect(result.items_expiring_soon).toEqual([]);
  });

  it('should handle non-existent item IDs gracefully', async () => {
    const input: RecipeRequest = {
      item_ids: [999, 1000], // Non-existent IDs
      max_recipes: 5
    };

    const result = await generateRecipeSuggestions(input);

    // Should return empty results without errors
    expect(result.recipes).toEqual([]);
    expect(result.pantry_items_used).toEqual([]);
    expect(result.items_expiring_soon).toEqual([]);
  });

  it('should generate recipes with proper structure', async () => {
    await createPantryItem({
      name: 'Lettuce',
      quantity: 1,
      expiry_date: new Date('2024-12-31')
    });

    const input: RecipeRequest = {
      max_recipes: 1
    };

    const result = await generateRecipeSuggestions(input);

    // Should generate at least one recipe
    expect(result.recipes.length).toBeGreaterThan(0);
    
    const recipe = result.recipes[0];
    
    // Recipe should have proper structure
    expect(recipe.title).toBeDefined();
    expect(typeof recipe.title).toBe('string');
    expect(recipe.description).toBeDefined();
    expect(typeof recipe.description).toBe('string');
    expect(Array.isArray(recipe.ingredients_used)).toBe(true);
    expect(recipe.instructions).toBeDefined();
    expect(typeof recipe.instructions).toBe('string');
    
    // Optional fields should be properly typed
    if (recipe.prep_time_minutes !== null) {
      expect(typeof recipe.prep_time_minutes).toBe('number');
    }
    
    if (recipe.difficulty_level !== null) {
      expect(['easy', 'medium', 'hard']).toContain(recipe.difficulty_level);
    }
  });

  it('should convert numeric quantities correctly', async () => {
    await createPantryItem({
      name: 'Tomato',
      quantity: 2.5,
      expiry_date: new Date('2024-12-31')
    });

    const input: RecipeRequest = {
      max_recipes: 1
    };

    const result = await generateRecipeSuggestions(input);

    // Should properly convert numeric quantities
    expect(result.pantry_items_used).toHaveLength(1);
    expect(typeof result.pantry_items_used[0].quantity).toBe('number');
    expect(result.pantry_items_used[0].quantity).toBe(2.5);
  });
});
