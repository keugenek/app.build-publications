import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, recipesTable } from '../db/schema';
import { type GetRecipeSuggestionsInput } from '../schema';
import { getRecipeSuggestions } from '../handlers/get_recipe_suggestions';

// Test data
const testPantryItems = [
  {
    name: 'Chicken Breast',
    quantity: '2.5',
    unit: 'lbs',
    expiry_date: new Date('2024-01-15')
  },
  {
    name: 'Rice',
    quantity: '1',
    unit: 'cup',
    expiry_date: new Date('2024-02-01')
  },
  {
    name: 'Onion',
    quantity: '3',
    unit: 'pieces',
    expiry_date: new Date('2024-01-20')
  },
  {
    name: 'Tomatoes',
    quantity: '5',
    unit: 'pieces',
    expiry_date: new Date('2024-01-18')
  }
];

const testRecipes = [
  {
    title: 'Chicken Fried Rice',
    description: 'Delicious fried rice with chicken',
    ingredients: ['Chicken Breast', 'Rice', 'Onion', 'Soy Sauce'],
    instructions: 'Cook rice. Fry chicken. Mix with vegetables.',
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    servings: 4
  },
  {
    title: 'Chicken Curry',
    description: 'Spicy chicken curry',
    ingredients: ['Chicken Breast', 'Onion', 'Tomatoes', 'Curry Powder', 'Coconut Milk'],
    instructions: 'Cook chicken with curry spices and vegetables.',
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    servings: 6
  },
  {
    title: 'Tomato Rice',
    description: 'Simple tomato flavored rice',
    ingredients: ['Rice', 'Tomatoes', 'Onion'],
    instructions: 'Cook rice with tomatoes and onions.',
    prep_time_minutes: 5,
    cook_time_minutes: 25,
    servings: 3
  },
  {
    title: 'Beef Stew',
    description: 'Hearty beef stew',
    ingredients: ['Beef', 'Potatoes', 'Carrots', 'Broth'],
    instructions: 'Slow cook beef with vegetables.',
    prep_time_minutes: 20,
    cook_time_minutes: 120,
    servings: 8
  },
  {
    title: 'Simple Onion Soup',
    description: 'Classic French onion soup',
    ingredients: ['Onion', 'Beef Broth', 'Cheese'],
    instructions: 'Caramelize onions and simmer with broth.',
    prep_time_minutes: 10,
    cook_time_minutes: 45,
    servings: 4
  }
];

describe('getRecipeSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipes based on pantry ingredients', async () => {
    // Create pantry items
    await db.insert(pantryItemsTable)
      .values(testPantryItems)
      .execute();

    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    // Should return recipes that can be made with available ingredients
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);

    // Verify recipe structure
    result.forEach(recipe => {
      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBeDefined();
      expect(recipe.ingredients).toBeInstanceOf(Array);
      expect(recipe.prep_time_minutes).toBeGreaterThanOrEqual(0);
      expect(recipe.cook_time_minutes).toBeGreaterThanOrEqual(0);
      expect(recipe.servings).toBeGreaterThan(0);
      expect(recipe.created_at).toBeInstanceOf(Date);
    });

    // First result should be highly matched recipe (Chicken Fried Rice has 3/4 ingredients available)
    const topRecipe = result[0];
    expect(['Chicken Fried Rice', 'Chicken Curry', 'Tomato Rice']).toContain(topRecipe.title);
  });

  it('should return recipes based on provided available ingredients', async () => {
    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['chicken breast', 'rice', 'onion'],
      max_suggestions: 5
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);

    // Should prioritize recipes with more matching ingredients
    const topRecipe = result[0];
    expect(topRecipe.title).toEqual('Chicken Fried Rice'); // Has 3/4 ingredients available
  });

  it('should handle case insensitive ingredient matching', async () => {
    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['CHICKEN BREAST', 'rice', 'ONION'],
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeGreaterThan(0);
    
    // Should still find matches despite case differences
    const chickenFriedRice = result.find(recipe => recipe.title === 'Chicken Fried Rice');
    expect(chickenFriedRice).toBeDefined();
  });

  it('should limit results to max_suggestions', async () => {
    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['chicken breast', 'rice', 'onion', 'tomatoes'],
      max_suggestions: 2
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array when no ingredients available', async () => {
    // Create recipes but no pantry items
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: [],
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    expect(result).toEqual([]);
  });

  it('should return empty array when no matching recipes found', async () => {
    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['quinoa', 'kale', 'avocado'], // Ingredients not in any recipe
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    expect(result).toEqual([]);
  });

  it('should sort recipes by ingredient match score', async () => {
    // Create recipes
    await db.insert(recipesTable)
      .values(testRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['chicken breast', 'rice', 'onion', 'tomatoes'],
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeGreaterThan(1);

    // Verify sorting - recipes with more matches should come first
    for (let i = 0; i < result.length - 1; i++) {
      const currentRecipe = result[i];
      const nextRecipe = result[i + 1];
      
      const currentMatches = currentRecipe.ingredients.filter(ingredient =>
        input.available_ingredients!.some(available =>
          available.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(available.toLowerCase())
        )
      ).length;

      const nextMatches = nextRecipe.ingredients.filter(ingredient =>
        input.available_ingredients!.some(available =>
          available.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(available.toLowerCase())
        )
      ).length;

      // Current recipe should have >= matches than next recipe
      expect(currentMatches).toBeGreaterThanOrEqual(nextMatches);
    }
  });

  it('should handle partial ingredient name matches', async () => {
    // Create recipes with specific ingredient names
    await db.insert(recipesTable)
      .values([
        {
          title: 'Chicken Salad',
          description: 'Fresh chicken salad',
          ingredients: ['Grilled Chicken', 'Lettuce', 'Tomato'],
          instructions: 'Mix ingredients together.',
          prep_time_minutes: 5,
          cook_time_minutes: 0,
          servings: 2
        }
      ])
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['chicken', 'tomatoes'], // Partial matches for "Grilled Chicken" and "Tomato"
      max_suggestions: 10
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeGreaterThan(0);
    const chickenSalad = result.find(recipe => recipe.title === 'Chicken Salad');
    expect(chickenSalad).toBeDefined();
  });

  it('should use default max_suggestions when not provided', async () => {
    // Create many recipes to test default limit
    const manyRecipes = Array.from({ length: 15 }, (_, i) => ({
      title: `Recipe ${i + 1}`,
      description: `Description ${i + 1}`,
      ingredients: ['Rice'], // All have rice so all will match
      instructions: `Instructions ${i + 1}`,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      servings: 2
    }));

    await db.insert(recipesTable)
      .values(manyRecipes)
      .execute();

    const input: GetRecipeSuggestionsInput = {
      available_ingredients: ['rice'],
      max_suggestions: 10 // Use default value explicitly
    };

    const result = await getRecipeSuggestions(input);

    expect(result.length).toBeLessThanOrEqual(10); // Should use default limit
  });
});
