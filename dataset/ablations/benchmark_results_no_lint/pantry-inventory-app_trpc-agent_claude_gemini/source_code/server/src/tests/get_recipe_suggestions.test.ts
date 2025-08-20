import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, recipesTable } from '../db/schema';
import { type RecipeSuggestionsInput } from '../schema';
import { getRecipeSuggestions } from '../handlers/get_recipe_suggestions';

// Test input with default value
const defaultInput: RecipeSuggestionsInput = {
  min_matching_ingredients: 2
};

describe('getRecipeSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getRecipeSuggestions(defaultInput);
    expect(result).toEqual([]);
  });

  it('should return empty array when no pantry items exist', async () => {
    // Create a recipe but no pantry items
    await db.insert(recipesTable)
      .values({
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['flour', 'eggs', 'milk'],
        instructions: 'Mix and cook',
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 4
      })
      .execute();

    const result = await getRecipeSuggestions(defaultInput);
    expect(result).toEqual([]);
  });

  it('should return recipes with matching ingredients', async () => {
    // Create pantry items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'flour',
          quantity: '2',
          unit: 'cups',
          expiration_date: tomorrowString,
          category: 'baking',
          notes: null
        },
        {
          name: 'eggs',
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        },
        {
          name: 'milk',
          quantity: '1',
          unit: 'gallon',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create a recipe that matches available ingredients
    await db.insert(recipesTable)
      .values({
        name: 'Pancakes',
        description: 'Fluffy pancakes',
        ingredients: ['flour', 'eggs', 'milk'],
        instructions: 'Mix ingredients and cook on griddle',
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        servings: 4
      })
      .execute();

    const result = await getRecipeSuggestions(defaultInput);

    expect(result).toHaveLength(1);
    expect(result[0].recipe.name).toEqual('Pancakes');
    expect(result[0].matching_ingredients).toEqual(['flour', 'eggs', 'milk']);
    expect(result[0].missing_ingredients).toEqual([]);
    expect(result[0].match_percentage).toEqual(100);
  });

  it('should handle partial matches correctly', async () => {
    // Create pantry items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'flour',
          quantity: '2',
          unit: 'cups',
          expiration_date: tomorrowString,
          category: 'baking',
          notes: null
        },
        {
          name: 'eggs',
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create a recipe with some missing ingredients
    await db.insert(recipesTable)
      .values({
        name: 'Cake',
        description: 'Chocolate cake',
        ingredients: ['flour', 'eggs', 'milk', 'sugar'],
        instructions: 'Mix and bake',
        prep_time_minutes: 20,
        cook_time_minutes: 40,
        servings: 8
      })
      .execute();

    const result = await getRecipeSuggestions(defaultInput);

    expect(result).toHaveLength(1);
    expect(result[0].recipe.name).toEqual('Cake');
    expect(result[0].matching_ingredients).toEqual(['flour', 'eggs']);
    expect(result[0].missing_ingredients).toEqual(['milk', 'sugar']);
    expect(result[0].match_percentage).toEqual(50);
  });

  it('should filter recipes below minimum matching threshold', async () => {
    // Create pantry items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values({
        name: 'flour',
        quantity: '2',
        unit: 'cups',
        expiration_date: tomorrowString,
        category: 'baking',
        notes: null
      })
      .execute();

    // Create recipes with different matching levels
    await db.insert(recipesTable)
      .values([
        {
          name: 'Simple Bread',
          description: 'Basic bread',
          ingredients: ['flour'], // Only 1 match - below threshold
          instructions: 'Mix and bake',
          prep_time_minutes: 10,
          cook_time_minutes: 30,
          servings: 6
        },
        {
          name: 'Complex Cake',
          description: 'Multi-ingredient cake',
          ingredients: ['flour', 'eggs', 'milk', 'sugar', 'butter'], // Only 1 match - below threshold
          instructions: 'Mix and bake',
          prep_time_minutes: 30,
          cook_time_minutes: 60,
          servings: 12
        }
      ])
      .execute();

    const result = await getRecipeSuggestions(defaultInput);
    expect(result).toHaveLength(0); // Both recipes have only 1 matching ingredient, below threshold of 2
  });

  it('should exclude expired pantry items', async () => {
    // Create expired pantry items
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'expired_flour',
          quantity: '2',
          unit: 'cups',
          expiration_date: yesterdayString, // Expired
          category: 'baking',
          notes: null
        },
        {
          name: 'fresh_eggs',
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString, // Fresh
          category: 'dairy',
          notes: null
        },
        {
          name: 'fresh_milk',
          quantity: '1',
          unit: 'gallon',
          expiration_date: tomorrowString, // Fresh
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create a recipe
    await db.insert(recipesTable)
      .values({
        name: 'Test Recipe',
        description: 'Test with expired ingredients',
        ingredients: ['expired_flour', 'fresh_eggs', 'fresh_milk'],
        instructions: 'Mix and cook',
        prep_time_minutes: 15,
        cook_time_minutes: 25,
        servings: 4
      })
      .execute();

    const result = await getRecipeSuggestions(defaultInput);

    expect(result).toHaveLength(1);
    expect(result[0].matching_ingredients).toEqual(['fresh_eggs', 'fresh_milk']);
    expect(result[0].missing_ingredients).toEqual(['expired_flour']);
    expect(result[0].match_percentage).toEqual(66.67); // 2 out of 3 ingredients
  });

  it('should sort results by match percentage descending', async () => {
    // Create pantry items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'flour',
          quantity: '2',
          unit: 'cups',
          expiration_date: tomorrowString,
          category: 'baking',
          notes: null
        },
        {
          name: 'eggs',
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        },
        {
          name: 'milk',
          quantity: '1',
          unit: 'gallon',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create recipes with different match percentages
    await db.insert(recipesTable)
      .values([
        {
          name: 'Perfect Match',
          description: '100% match',
          ingredients: ['flour', 'eggs'], // 100% match
          instructions: 'Simple recipe',
          prep_time_minutes: 5,
          cook_time_minutes: 10,
          servings: 2
        },
        {
          name: 'Partial Match',
          description: '66% match',
          ingredients: ['flour', 'eggs', 'sugar'], // 66.67% match
          instructions: 'Medium recipe',
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 4
        },
        {
          name: 'Low Match',
          description: '50% match',
          ingredients: ['flour', 'sugar', 'butter', 'vanilla'], // 25% match - but meets min threshold with 1 match if threshold is 1
          instructions: 'Complex recipe',
          prep_time_minutes: 20,
          cook_time_minutes: 30,
          servings: 6
        }
      ])
      .execute();

    // Use min_matching_ingredients of 1 to include all recipes
    const result = await getRecipeSuggestions({ min_matching_ingredients: 1 });

    expect(result).toHaveLength(3);
    expect(result[0].recipe.name).toEqual('Perfect Match');
    expect(result[0].match_percentage).toEqual(100);
    expect(result[1].recipe.name).toEqual('Partial Match');
    expect(result[1].match_percentage).toEqual(66.67);
    expect(result[2].recipe.name).toEqual('Low Match');
    expect(result[2].match_percentage).toEqual(25);
  });

  it('should handle case-insensitive ingredient matching', async () => {
    // Create pantry items with different cases
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'FLOUR', // Uppercase
          quantity: '2',
          unit: 'cups',
          expiration_date: tomorrowString,
          category: 'baking',
          notes: null
        },
        {
          name: 'Eggs', // Mixed case
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create recipe with lowercase ingredients
    await db.insert(recipesTable)
      .values({
        name: 'Case Test Recipe',
        description: 'Test case sensitivity',
        ingredients: ['flour', 'eggs'], // Lowercase
        instructions: 'Mix ingredients',
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        servings: 2
      })
      .execute();

    const result = await getRecipeSuggestions(defaultInput);

    expect(result).toHaveLength(1);
    expect(result[0].matching_ingredients).toEqual(['flour', 'eggs']);
    expect(result[0].missing_ingredients).toEqual([]);
    expect(result[0].match_percentage).toEqual(100);
  });

  it('should handle custom minimum matching ingredients threshold', async () => {
    // Create pantry items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'flour',
          quantity: '2',
          unit: 'cups',
          expiration_date: tomorrowString,
          category: 'baking',
          notes: null
        },
        {
          name: 'eggs',
          quantity: '12',
          unit: 'pieces',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        },
        {
          name: 'milk',
          quantity: '1',
          unit: 'gallon',
          expiration_date: tomorrowString,
          category: 'dairy',
          notes: null
        }
      ])
      .execute();

    // Create recipe with 2 matching ingredients
    await db.insert(recipesTable)
      .values({
        name: 'Two Ingredient Recipe',
        description: 'Simple recipe',
        ingredients: ['flour', 'eggs', 'sugar', 'butter'],
        instructions: 'Mix and cook',
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 4
      })
      .execute();

    // Test with higher threshold
    const result = await getRecipeSuggestions({ min_matching_ingredients: 3 });
    expect(result).toHaveLength(0); // Recipe only has 2 matching ingredients, below threshold of 3

    // Test with lower threshold
    const result2 = await getRecipeSuggestions({ min_matching_ingredients: 1 });
    expect(result2).toHaveLength(1); // Recipe has 2 matching ingredients, above threshold of 1
  });
});
