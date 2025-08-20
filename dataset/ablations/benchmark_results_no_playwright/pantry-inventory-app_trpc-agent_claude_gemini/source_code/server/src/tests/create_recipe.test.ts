import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateRecipeInput = {
  title: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish with eggs, cheese, and bacon',
  ingredients: ['spaghetti', 'eggs', 'parmesan cheese', 'bacon', 'black pepper'],
  instructions: 'Cook pasta. Fry bacon. Mix eggs and cheese. Combine all ingredients while pasta is hot.',
  prep_time_minutes: 10,
  cook_time_minutes: 15,
  servings: 4
};

// Complex test input with more ingredients
const complexInput: CreateRecipeInput = {
  title: 'Vegetable Stir Fry',
  description: 'Healthy mixed vegetable stir fry with soy sauce',
  ingredients: [
    'broccoli',
    'bell peppers',
    'carrots',
    'snap peas',
    'garlic',
    'ginger',
    'soy sauce',
    'sesame oil',
    'vegetable oil'
  ],
  instructions: 'Heat oil in wok. Add garlic and ginger. Add hard vegetables first, then softer ones. Stir fry until tender-crisp. Add soy sauce and sesame oil.',
  prep_time_minutes: 15,
  cook_time_minutes: 8,
  servings: 2
};

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a recipe with all required fields', async () => {
    const result = await createRecipe(testInput);

    // Basic field validation
    expect(result.title).toEqual('Spaghetti Carbonara');
    expect(result.description).toEqual(testInput.description);
    expect(result.ingredients).toEqual(['spaghetti', 'eggs', 'parmesan cheese', 'bacon', 'black pepper']);
    expect(result.instructions).toEqual(testInput.instructions);
    expect(result.prep_time_minutes).toEqual(10);
    expect(result.cook_time_minutes).toEqual(15);
    expect(result.servings).toEqual(4);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save recipe to database correctly', async () => {
    const result = await createRecipe(testInput);

    // Query using proper drizzle syntax
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    const savedRecipe = recipes[0];
    
    expect(savedRecipe.title).toEqual('Spaghetti Carbonara');
    expect(savedRecipe.description).toEqual(testInput.description);
    expect(savedRecipe.ingredients).toEqual(['spaghetti', 'eggs', 'parmesan cheese', 'bacon', 'black pepper']);
    expect(savedRecipe.instructions).toEqual(testInput.instructions);
    expect(savedRecipe.prep_time_minutes).toEqual(10);
    expect(savedRecipe.cook_time_minutes).toEqual(15);
    expect(savedRecipe.servings).toEqual(4);
    expect(savedRecipe.created_at).toBeInstanceOf(Date);
  });

  it('should handle recipes with many ingredients', async () => {
    const result = await createRecipe(complexInput);

    expect(result.title).toEqual('Vegetable Stir Fry');
    expect(result.ingredients).toHaveLength(9);
    expect(result.ingredients).toContain('broccoli');
    expect(result.ingredients).toContain('sesame oil');
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(8);
    expect(result.servings).toEqual(2);

    // Verify in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes[0].ingredients).toEqual(complexInput.ingredients);
  });

  it('should handle recipes with zero prep or cook time', async () => {
    const quickInput: CreateRecipeInput = {
      title: 'Instant Smoothie',
      description: 'No-cook fruit smoothie',
      ingredients: ['banana', 'milk', 'honey'],
      instructions: 'Blend all ingredients until smooth.',
      prep_time_minutes: 2,
      cook_time_minutes: 0, // No cooking required
      servings: 1
    };

    const result = await createRecipe(quickInput);

    expect(result.cook_time_minutes).toEqual(0);
    expect(result.prep_time_minutes).toEqual(2);
    expect(result.title).toEqual('Instant Smoothie');

    // Verify in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes[0].cook_time_minutes).toEqual(0);
    expect(recipes[0].prep_time_minutes).toEqual(2);
  });

  it('should handle single-ingredient recipes', async () => {
    const simpleInput: CreateRecipeInput = {
      title: 'Boiled Egg',
      description: 'Simple boiled egg',
      ingredients: ['egg'],
      instructions: 'Boil water. Add egg. Cook for 8 minutes. Cool in ice water.',
      prep_time_minutes: 1,
      cook_time_minutes: 10,
      servings: 1
    };

    const result = await createRecipe(simpleInput);

    expect(result.ingredients).toEqual(['egg']);
    expect(result.ingredients).toHaveLength(1);

    // Verify in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes[0].ingredients).toEqual(['egg']);
  });

  it('should create multiple recipes independently', async () => {
    const result1 = await createRecipe(testInput);
    const result2 = await createRecipe(complexInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Spaghetti Carbonara');
    expect(result2.title).toEqual('Vegetable Stir Fry');

    // Verify both exist in database
    const allRecipes = await db.select()
      .from(recipesTable)
      .execute();

    expect(allRecipes).toHaveLength(2);
    
    const titles = allRecipes.map(recipe => recipe.title);
    expect(titles).toContain('Spaghetti Carbonara');
    expect(titles).toContain('Vegetable Stir Fry');
  });

  it('should preserve created_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createRecipe(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);

    // Verify timestamp is preserved in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes[0].created_at).toBeInstanceOf(Date);
    expect(recipes[0].created_at).toEqual(result.created_at);
  });
});
