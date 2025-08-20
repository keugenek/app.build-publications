import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateRecipeInput = {
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: ['flour', 'eggs', 'milk', 'sugar'],
  instructions: 'Mix all ingredients and bake at 350°F for 30 minutes',
  prep_time_minutes: 15,
  cook_time_minutes: 30,
  servings: 4
};

// Minimal test input with only required fields
const minimalInput: CreateRecipeInput = {
  name: 'Minimal Recipe',
  ingredients: ['ingredient1', 'ingredient2']
};

// Input with empty optional fields
const inputWithNulls: CreateRecipeInput = {
  name: 'Recipe with Nulls',
  description: null,
  ingredients: ['salt', 'pepper'],
  instructions: null,
  prep_time_minutes: undefined,
  cook_time_minutes: undefined,
  servings: undefined
};

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a recipe with all fields', async () => {
    const result = await createRecipe(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.ingredients).toEqual(['flour', 'eggs', 'milk', 'sugar']);
    expect(result.instructions).toEqual('Mix all ingredients and bake at 350°F for 30 minutes');
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(30);
    expect(result.servings).toEqual(4);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a recipe with minimal fields', async () => {
    const result = await createRecipe(minimalInput);

    // Required field validation
    expect(result.name).toEqual('Minimal Recipe');
    expect(result.ingredients).toEqual(['ingredient1', 'ingredient2']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Optional fields should be null
    expect(result.description).toBeNull();
    expect(result.instructions).toBeNull();
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
  });

  it('should handle null and undefined optional fields correctly', async () => {
    const result = await createRecipe(inputWithNulls);

    expect(result.name).toEqual('Recipe with Nulls');
    expect(result.ingredients).toEqual(['salt', 'pepper']);
    expect(result.description).toBeNull();
    expect(result.instructions).toBeNull();
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
  });

  it('should save recipe to database', async () => {
    const result = await createRecipe(testInput);

    // Query using proper drizzle syntax
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    const savedRecipe = recipes[0];
    
    expect(savedRecipe.name).toEqual('Test Recipe');
    expect(savedRecipe.description).toEqual('A delicious test recipe');
    expect(savedRecipe.ingredients).toEqual(['flour', 'eggs', 'milk', 'sugar']);
    expect(savedRecipe.instructions).toEqual('Mix all ingredients and bake at 350°F for 30 minutes');
    expect(savedRecipe.prep_time_minutes).toEqual(15);
    expect(savedRecipe.cook_time_minutes).toEqual(30);
    expect(savedRecipe.servings).toEqual(4);
    expect(savedRecipe.created_at).toBeInstanceOf(Date);
  });

  it('should handle empty ingredients array', async () => {
    const inputWithEmptyIngredients: CreateRecipeInput = {
      name: 'Empty Ingredients Recipe',
      ingredients: []
    };

    const result = await createRecipe(inputWithEmptyIngredients);

    expect(result.name).toEqual('Empty Ingredients Recipe');
    expect(result.ingredients).toEqual([]);
    expect(Array.isArray(result.ingredients)).toBe(true);
  });

  it('should create multiple recipes successfully', async () => {
    const recipe1 = await createRecipe({
      name: 'First Recipe',
      ingredients: ['ingredient1']
    });

    const recipe2 = await createRecipe({
      name: 'Second Recipe',
      ingredients: ['ingredient2']
    });

    expect(recipe1.id).not.toEqual(recipe2.id);
    expect(recipe1.name).toEqual('First Recipe');
    expect(recipe2.name).toEqual('Second Recipe');

    // Verify both are saved to database
    const allRecipes = await db.select().from(recipesTable).execute();
    expect(allRecipes).toHaveLength(2);
  });

  it('should handle large ingredient lists', async () => {
    const largeIngredientList = Array.from({ length: 20 }, (_, i) => `ingredient${i + 1}`);
    const inputWithManyIngredients: CreateRecipeInput = {
      name: 'Complex Recipe',
      ingredients: largeIngredientList,
      description: 'A recipe with many ingredients'
    };

    const result = await createRecipe(inputWithManyIngredients);

    expect(result.ingredients).toHaveLength(20);
    expect(result.ingredients).toEqual(largeIngredientList);
  });

  it('should preserve ingredient order', async () => {
    const orderedIngredients = ['first', 'second', 'third', 'fourth'];
    const inputWithOrderedIngredients: CreateRecipeInput = {
      name: 'Ordered Recipe',
      ingredients: orderedIngredients
    };

    const result = await createRecipe(inputWithOrderedIngredients);

    expect(result.ingredients).toEqual(orderedIngredients);
    
    // Verify order is preserved in database
    const savedRecipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(savedRecipes[0].ingredients).toEqual(orderedIngredients);
  });
});
