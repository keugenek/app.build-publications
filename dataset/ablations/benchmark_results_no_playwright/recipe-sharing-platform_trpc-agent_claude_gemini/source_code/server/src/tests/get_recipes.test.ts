import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { getRecipes } from '../handlers/get_recipes';

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(result).toEqual([]);
  });

  it('should return recipe with all details', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testchef',
        email: 'chef@test.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        instructions: 'Mix and cook',
        author_id: userId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Add ingredients
    await db.insert(ingredientsTable)
      .values([
        {
          recipe_id: recipeId,
          name: 'Flour',
          quantity: '2',
          unit: 'cups'
        },
        {
          recipe_id: recipeId,
          name: 'Sugar',
          quantity: '1',
          unit: 'cup'
        }
      ])
      .execute();

    // Add categories
    await db.insert(recipeCategoriesTable)
      .values([
        {
          recipe_id: recipeId,
          category: 'Dessert'
        },
        {
          recipe_id: recipeId,
          category: 'Vegetarian'
        }
      ])
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    const recipe = result[0];

    // Check recipe basic info
    expect(recipe.id).toBe(recipeId);
    expect(recipe.title).toBe('Test Recipe');
    expect(recipe.description).toBe('A delicious test recipe');
    expect(recipe.instructions).toBe('Mix and cook');
    expect(recipe.author_id).toBe(userId);
    expect(recipe.author_username).toBe('testchef');
    expect(recipe.created_at).toBeInstanceOf(Date);
    expect(recipe.updated_at).toBeInstanceOf(Date);

    // Check ingredients
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.ingredients[0].name).toBe('Flour');
    expect(recipe.ingredients[0].quantity).toBe('2');
    expect(recipe.ingredients[0].unit).toBe('cups');
    expect(recipe.ingredients[1].name).toBe('Sugar');
    expect(recipe.ingredients[1].quantity).toBe('1');
    expect(recipe.ingredients[1].unit).toBe('cup');

    // Check categories
    expect(recipe.categories).toHaveLength(2);
    expect(recipe.categories).toContain('Dessert');
    expect(recipe.categories).toContain('Vegetarian');
  });

  it('should return multiple recipes with correct details', async () => {
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'chef1',
        email: 'chef1@test.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'chef2',
        email: 'chef2@test.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create test recipes
    const recipe1Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe One',
        description: 'First recipe',
        instructions: 'Cook first',
        author_id: user1Id
      })
      .returning()
      .execute();
    const recipe1Id = recipe1Result[0].id;

    const recipe2Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe Two',
        description: 'Second recipe',
        instructions: 'Cook second',
        author_id: user2Id
      })
      .returning()
      .execute();
    const recipe2Id = recipe2Result[0].id;

    // Add ingredients to first recipe
    await db.insert(ingredientsTable)
      .values({
        recipe_id: recipe1Id,
        name: 'Tomato',
        quantity: '3',
        unit: 'pieces'
      })
      .execute();

    // Add categories to second recipe
    await db.insert(recipeCategoriesTable)
      .values({
        recipe_id: recipe2Id,
        category: 'Lunch'
      })
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);

    // Find recipes by title
    const recipe1 = result.find(r => r.title === 'Recipe One');
    const recipe2 = result.find(r => r.title === 'Recipe Two');

    expect(recipe1).toBeDefined();
    expect(recipe2).toBeDefined();

    // Check first recipe
    expect(recipe1!.author_username).toBe('chef1');
    expect(recipe1!.ingredients).toHaveLength(1);
    expect(recipe1!.ingredients[0].name).toBe('Tomato');
    expect(recipe1!.categories).toHaveLength(0);

    // Check second recipe
    expect(recipe2!.author_username).toBe('chef2');
    expect(recipe2!.ingredients).toHaveLength(0);
    expect(recipe2!.categories).toHaveLength(1);
    expect(recipe2!.categories[0]).toBe('Lunch');
  });

  it('should handle recipe with no ingredients or categories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'minimalist',
        email: 'minimal@test.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe without ingredients or categories
    await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: 'Very simple',
        instructions: 'Just serve',
        author_id: userId
      })
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    const recipe = result[0];

    expect(recipe.title).toBe('Minimal Recipe');
    expect(recipe.author_username).toBe('minimalist');
    expect(recipe.ingredients).toEqual([]);
    expect(recipe.categories).toEqual([]);
  });

  it('should handle ingredients with null units', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testchef',
        email: 'chef@test.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'Testing null units',
        instructions: 'Mix ingredients',
        author_id: userId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Add ingredient with null unit
    await db.insert(ingredientsTable)
      .values({
        recipe_id: recipeId,
        name: 'Salt',
        quantity: 'to taste',
        unit: null
      })
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    const recipe = result[0];

    expect(recipe.ingredients).toHaveLength(1);
    expect(recipe.ingredients[0].name).toBe('Salt');
    expect(recipe.ingredients[0].quantity).toBe('to taste');
    expect(recipe.ingredients[0].unit).toBeNull();
  });
});
