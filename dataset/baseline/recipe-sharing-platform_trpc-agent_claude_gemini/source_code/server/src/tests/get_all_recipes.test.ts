import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { type CreateRecipeInput, type RecipeCategory } from '../schema';
import { getAllRecipes } from '../handlers/get_all_recipes';

describe('getAllRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getAllRecipes();

    expect(result).toEqual([]);
  });

  it('should return all recipes with proper formatting', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test recipe
    const testRecipe: CreateRecipeInput = {
      title: 'Test Recipe',
      description: 'A delicious test recipe',
      ingredients: ['ingredient 1', 'ingredient 2'],
      instructions: ['step 1', 'step 2'],
      categories: ['breakfast', 'healthy'],
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 4,
      difficulty: 'easy',
      author_id: userId
    };

    await db.insert(recipesTable)
      .values({
        title: testRecipe.title,
        description: testRecipe.description,
        ingredients: testRecipe.ingredients,
        instructions: testRecipe.instructions,
        categories: testRecipe.categories,
        prep_time_minutes: testRecipe.prep_time_minutes,
        cook_time_minutes: testRecipe.cook_time_minutes,
        servings: testRecipe.servings,
        difficulty: testRecipe.difficulty,
        author_id: testRecipe.author_id
      })
      .execute();

    const result = await getAllRecipes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Recipe');
    expect(result[0].description).toEqual('A delicious test recipe');
    expect(result[0].ingredients).toEqual(['ingredient 1', 'ingredient 2']);
    expect(result[0].instructions).toEqual(['step 1', 'step 2']);
    expect(result[0].categories).toEqual(['breakfast', 'healthy']);
    expect(result[0].prep_time_minutes).toEqual(15);
    expect(result[0].cook_time_minutes).toEqual(30);
    expect(result[0].servings).toEqual(4);
    expect(result[0].difficulty).toEqual('easy');
    expect(result[0].author_id).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple recipes ordered by creation date (newest first)', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first recipe
    const firstRecipe = await db.insert(recipesTable)
      .values({
        title: 'First Recipe',
        description: 'First recipe description',
        ingredients: ['ingredient A'],
        instructions: ['step A'],
        categories: ['breakfast'],
        author_id: userId
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second recipe
    const secondRecipe = await db.insert(recipesTable)
      .values({
        title: 'Second Recipe',
        description: 'Second recipe description',
        ingredients: ['ingredient B'],
        instructions: ['step B'],
        categories: ['lunch'],
        author_id: userId
      })
      .returning()
      .execute();

    const result = await getAllRecipes();

    expect(result).toHaveLength(2);
    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('Second Recipe');
    expect(result[1].title).toEqual('First Recipe');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle recipes with nullable fields correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create recipe with minimal required fields (nullable fields left as null)
    await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null, // Nullable
        ingredients: ['basic ingredient'],
        instructions: ['basic step'],
        categories: ['snack'],
        prep_time_minutes: null, // Nullable
        cook_time_minutes: null, // Nullable
        servings: null, // Nullable
        difficulty: null, // Nullable
        author_id: userId
      })
      .execute();

    const result = await getAllRecipes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Recipe');
    expect(result[0].description).toBeNull();
    expect(result[0].prep_time_minutes).toBeNull();
    expect(result[0].cook_time_minutes).toBeNull();
    expect(result[0].servings).toBeNull();
    expect(result[0].difficulty).toBeNull();
    expect(result[0].ingredients).toEqual(['basic ingredient']);
    expect(result[0].instructions).toEqual(['basic step']);
    expect(result[0].categories).toEqual(['snack']);
  });

  it('should handle complex recipe data correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create recipe with complex data
    const complexIngredients = [
      '2 cups all-purpose flour',
      '1 tsp baking powder',
      '1/2 cup sugar',
      '2 large eggs',
      '1 cup milk'
    ];

    const complexInstructions = [
      'Preheat oven to 350°F (175°C)',
      'Mix dry ingredients in a large bowl',
      'In another bowl, whisk eggs and milk',
      'Combine wet and dry ingredients',
      'Bake for 25-30 minutes until golden brown'
    ];

    const complexCategories: RecipeCategory[] = ['dessert', 'comfort_food', 'international'];

    await db.insert(recipesTable)
      .values({
        title: 'Complex Recipe with Special Characters & Numbers',
        description: 'A recipe with émojis 🍰 and special chars!',
        ingredients: complexIngredients,
        instructions: complexInstructions,
        categories: complexCategories,
        prep_time_minutes: 45,
        cook_time_minutes: 120,
        servings: 12,
        difficulty: 'hard',
        author_id: userId
      })
      .execute();

    const result = await getAllRecipes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Complex Recipe with Special Characters & Numbers');
    expect(result[0].description).toEqual('A recipe with émojis 🍰 and special chars!');
    expect(result[0].ingredients).toEqual(complexIngredients);
    expect(result[0].instructions).toEqual(complexInstructions);
    expect(result[0].categories).toEqual(complexCategories);
    expect(result[0].prep_time_minutes).toEqual(45);
    expect(result[0].cook_time_minutes).toEqual(120);
    expect(result[0].servings).toEqual(12);
    expect(result[0].difficulty).toEqual('hard');
  });
});
