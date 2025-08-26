import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { getRecipes } from '../handlers/get_recipes';

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(result).toEqual([]);
  });

  it('should return all recipes from database', async () => {
    // Create test recipes
    const recipe1 = {
      title: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta dish',
      ingredients: ['spaghetti', 'eggs', 'bacon', 'parmesan cheese'],
      instructions: 'Cook pasta, mix with eggs and bacon',
      prep_time_minutes: 15,
      cook_time_minutes: 20,
      servings: 4
    };

    const recipe2 = {
      title: 'Chicken Stir Fry',
      description: 'Quick and healthy chicken dish',
      ingredients: ['chicken breast', 'vegetables', 'soy sauce', 'rice'],
      instructions: 'Stir fry chicken and vegetables',
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      servings: 2
    };

    // Insert test recipes
    await db.insert(recipesTable)
      .values([recipe1, recipe2])
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    
    // Verify first recipe
    const firstRecipe = result.find(r => r.title === 'Spaghetti Carbonara');
    expect(firstRecipe).toBeDefined();
    expect(firstRecipe?.description).toBe('Classic Italian pasta dish');
    expect(firstRecipe?.ingredients).toEqual(['spaghetti', 'eggs', 'bacon', 'parmesan cheese']);
    expect(firstRecipe?.instructions).toBe('Cook pasta, mix with eggs and bacon');
    expect(firstRecipe?.prep_time_minutes).toBe(15);
    expect(firstRecipe?.cook_time_minutes).toBe(20);
    expect(firstRecipe?.servings).toBe(4);
    expect(firstRecipe?.id).toBeDefined();
    expect(firstRecipe?.created_at).toBeInstanceOf(Date);

    // Verify second recipe
    const secondRecipe = result.find(r => r.title === 'Chicken Stir Fry');
    expect(secondRecipe).toBeDefined();
    expect(secondRecipe?.description).toBe('Quick and healthy chicken dish');
    expect(secondRecipe?.ingredients).toEqual(['chicken breast', 'vegetables', 'soy sauce', 'rice']);
    expect(secondRecipe?.instructions).toBe('Stir fry chicken and vegetables');
    expect(secondRecipe?.prep_time_minutes).toBe(10);
    expect(secondRecipe?.cook_time_minutes).toBe(15);
    expect(secondRecipe?.servings).toBe(2);
    expect(secondRecipe?.id).toBeDefined();
    expect(secondRecipe?.created_at).toBeInstanceOf(Date);
  });

  it('should return recipes with correct data types', async () => {
    // Create test recipe with specific values to verify types
    const testRecipe = {
      title: 'Test Recipe',
      description: 'Recipe for testing data types',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: 'Test instructions',
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      servings: 1
    };

    await db.insert(recipesTable)
      .values(testRecipe)
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(typeof recipe.id).toBe('number');
    expect(typeof recipe.title).toBe('string');
    expect(typeof recipe.description).toBe('string');
    expect(Array.isArray(recipe.ingredients)).toBe(true);
    expect(typeof recipe.instructions).toBe('string');
    expect(typeof recipe.prep_time_minutes).toBe('number');
    expect(typeof recipe.cook_time_minutes).toBe('number');
    expect(typeof recipe.servings).toBe('number');
    expect(recipe.created_at).toBeInstanceOf(Date);
  });

  it('should handle recipes with complex ingredients array', async () => {
    // Test recipe with many ingredients
    const complexRecipe = {
      title: 'Complex Recipe',
      description: 'Recipe with many ingredients',
      ingredients: [
        '2 cups flour',
        '1 cup sugar',
        '3 eggs',
        '1/2 cup butter',
        '1 tsp vanilla extract',
        '1 cup milk',
        'pinch of salt'
      ],
      instructions: 'Mix all ingredients and bake',
      prep_time_minutes: 30,
      cook_time_minutes: 45,
      servings: 8
    };

    await db.insert(recipesTable)
      .values(complexRecipe)
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    const recipe = result[0];
    expect(recipe.ingredients).toHaveLength(7);
    expect(recipe.ingredients).toContain('2 cups flour');
    expect(recipe.ingredients).toContain('pinch of salt');
  });

  it('should return recipes ordered by creation date', async () => {
    // Create recipes at different times by inserting them separately
    const firstRecipe = {
      title: 'First Recipe',
      description: 'Created first',
      ingredients: ['ingredient'],
      instructions: 'Instructions',
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      servings: 1
    };

    const secondRecipe = {
      title: 'Second Recipe',
      description: 'Created second',
      ingredients: ['ingredient'],
      instructions: 'Instructions',
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      servings: 1
    };

    // Insert first recipe
    await db.insert(recipesTable)
      .values(firstRecipe)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second recipe
    await db.insert(recipesTable)
      .values(secondRecipe)
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    
    // Verify both recipes exist
    const titles = result.map(r => r.title);
    expect(titles).toContain('First Recipe');
    expect(titles).toContain('Second Recipe');
    
    // Verify all have valid creation dates
    result.forEach(recipe => {
      expect(recipe.created_at).toBeInstanceOf(Date);
      expect(recipe.created_at.getTime()).toBeGreaterThan(0);
    });
  });
});
