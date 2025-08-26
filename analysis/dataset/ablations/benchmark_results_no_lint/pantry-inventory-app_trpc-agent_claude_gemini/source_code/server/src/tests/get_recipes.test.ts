import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { getRecipes } from '../handlers/get_recipes';

// Test recipe data
const testRecipe1: CreateRecipeInput = {
  name: 'Pasta Carbonara',
  description: 'Classic Italian pasta dish',
  ingredients: ['pasta', 'eggs', 'bacon', 'parmesan cheese', 'black pepper'],
  instructions: '1. Cook pasta. 2. Fry bacon. 3. Mix eggs and cheese. 4. Combine all ingredients.',
  prep_time_minutes: 15,
  cook_time_minutes: 20,
  servings: 4
};

const testRecipe2: CreateRecipeInput = {
  name: 'Vegetable Stir Fry',
  description: 'Quick and healthy vegetable dish',
  ingredients: ['broccoli', 'carrots', 'bell peppers', 'soy sauce', 'garlic'],
  instructions: 'Stir fry all vegetables with sauce.',
  prep_time_minutes: 10,
  cook_time_minutes: 8,
  servings: 2
};

const testRecipe3: CreateRecipeInput = {
  name: 'Simple Smoothie',
  description: null,
  ingredients: ['banana', 'milk', 'honey'],
  instructions: null
  // Optional fields left undefined for CreateRecipeInput
};

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getRecipes();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all recipes when they exist', async () => {
    // Create test recipes
    await db.insert(recipesTable).values([
      {
        name: testRecipe1.name,
        description: testRecipe1.description,
        ingredients: testRecipe1.ingredients,
        instructions: testRecipe1.instructions,
        prep_time_minutes: testRecipe1.prep_time_minutes,
        cook_time_minutes: testRecipe1.cook_time_minutes,
        servings: testRecipe1.servings
      },
      {
        name: testRecipe2.name,
        description: testRecipe2.description,
        ingredients: testRecipe2.ingredients,
        instructions: testRecipe2.instructions,
        prep_time_minutes: testRecipe2.prep_time_minutes,
        cook_time_minutes: testRecipe2.cook_time_minutes,
        servings: testRecipe2.servings
      }
    ]).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    
    // Check that both recipes are returned
    const recipeNames = result.map(r => r.name);
    expect(recipeNames).toContain('Pasta Carbonara');
    expect(recipeNames).toContain('Vegetable Stir Fry');
    
    // Verify recipe structure and fields
    result.forEach(recipe => {
      expect(recipe.id).toBeDefined();
      expect(typeof recipe.id).toBe('number');
      expect(typeof recipe.name).toBe('string');
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(recipe.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle recipes with null values correctly', async () => {
    // Create recipe with null optional fields
    await db.insert(recipesTable).values({
      name: testRecipe3.name,
      description: testRecipe3.description,
      ingredients: testRecipe3.ingredients,
      instructions: testRecipe3.instructions,
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null
    }).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(recipe.name).toBe('Simple Smoothie');
    expect(recipe.description).toBeNull();
    expect(recipe.instructions).toBeNull();
    expect(recipe.prep_time_minutes).toBeNull();
    expect(recipe.cook_time_minutes).toBeNull();
    expect(recipe.servings).toBeNull();
    expect(recipe.ingredients).toEqual(['banana', 'milk', 'honey']);
    expect(recipe.created_at).toBeInstanceOf(Date);
  });

  it('should return recipes ordered by creation date (newest first)', async () => {
    // Create first recipe
    await db.insert(recipesTable).values({
      name: 'First Recipe',
      description: 'Created first',
      ingredients: ['ingredient1'],
      instructions: 'First instructions'
    }).execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second recipe
    await db.insert(recipesTable).values({
      name: 'Second Recipe',
      description: 'Created second',
      ingredients: ['ingredient2'],
      instructions: 'Second instructions'
    }).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    
    // Newest should be first (Second Recipe)
    expect(result[0].name).toBe('Second Recipe');
    expect(result[1].name).toBe('First Recipe');
    
    // Verify ordering by timestamps
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle ingredients array correctly', async () => {
    const complexIngredients = [
      'extra virgin olive oil',
      'fresh garlic cloves',
      'organic tomatoes',
      'fresh basil leaves',
      'aged parmesan cheese'
    ];

    await db.insert(recipesTable).values({
      name: 'Complex Recipe',
      description: 'Recipe with many ingredients',
      ingredients: complexIngredients,
      instructions: 'Complex cooking instructions'
    }).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(recipe.ingredients).toEqual(complexIngredients);
    expect(recipe.ingredients).toHaveLength(5);
    expect(recipe.ingredients[0]).toBe('extra virgin olive oil');
    expect(recipe.ingredients[4]).toBe('aged parmesan cheese');
  });

  it('should verify all recipe fields are present and correctly typed', async () => {
    await db.insert(recipesTable).values({
      name: 'Complete Recipe',
      description: 'A fully detailed recipe',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: 'Detailed cooking instructions',
      prep_time_minutes: 30,
      cook_time_minutes: 45,
      servings: 6
    }).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    
    // Check all required fields exist and have correct types
    expect(typeof recipe.id).toBe('number');
    expect(typeof recipe.name).toBe('string');
    expect(typeof recipe.description).toBe('string');
    expect(Array.isArray(recipe.ingredients)).toBe(true);
    expect(typeof recipe.instructions).toBe('string');
    expect(typeof recipe.prep_time_minutes).toBe('number');
    expect(typeof recipe.cook_time_minutes).toBe('number');
    expect(typeof recipe.servings).toBe('number');
    expect(recipe.created_at).toBeInstanceOf(Date);
    
    // Check specific values
    expect(recipe.name).toBe('Complete Recipe');
    expect(recipe.description).toBe('A fully detailed recipe');
    expect(recipe.ingredients).toEqual(['ingredient1', 'ingredient2']);
    expect(recipe.instructions).toBe('Detailed cooking instructions');
    expect(recipe.prep_time_minutes).toBe(30);
    expect(recipe.cook_time_minutes).toBe(45);
    expect(recipe.servings).toBe(6);
  });
});
