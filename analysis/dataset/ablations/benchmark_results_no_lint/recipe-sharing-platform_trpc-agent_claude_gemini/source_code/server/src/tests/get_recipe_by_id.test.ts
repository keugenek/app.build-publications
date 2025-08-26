import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { getRecipeById } from '../handlers/get_recipe_by_id';

describe('getRecipeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipe with user information when recipe exists', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
        instructions: ['step 1', 'step 2', 'step 3'],
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        category: 'main_course',
        user_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Get the recipe
    const result = await getRecipeById(recipeId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Test Recipe');
    expect(result!.description).toEqual('A delicious test recipe');
    expect(result!.ingredients).toEqual(['ingredient 1', 'ingredient 2', 'ingredient 3']);
    expect(result!.instructions).toEqual(['step 1', 'step 2', 'step 3']);
    expect(result!.prep_time_minutes).toEqual(15);
    expect(result!.cook_time_minutes).toEqual(30);
    expect(result!.servings).toEqual(4);
    expect(result!.category).toEqual('main_course');
    expect(result!.user_id).toEqual(userId);
    expect(result!.user_name).toEqual('Test User');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.is_favorite).toBeUndefined();
  });

  it('should return null when recipe does not exist', async () => {
    const result = await getRecipeById(999);
    expect(result).toBeNull();
  });

  it('should return recipe with is_favorite as false when user has not favorited', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1',
        name: 'User One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2',
        name: 'User Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a recipe by user1
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'User 1 Recipe',
        description: 'Recipe by user 1',
        ingredients: ['ingredient A'],
        instructions: ['step A'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 2,
        category: 'appetizer',
        user_id: user1Id
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Get the recipe from user2's perspective (not favorited)
    const result = await getRecipeById(recipeId, user2Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('User 1 Recipe');
    expect(result!.user_name).toEqual('User One');
    expect(result!.is_favorite).toEqual(false);
  });

  it('should return recipe with is_favorite as true when user has favorited', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1',
        name: 'User One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2',
        name: 'User Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a recipe by user1
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Favorited Recipe',
        description: 'A recipe that will be favorited',
        ingredients: ['favorite ingredient'],
        instructions: ['favorite step'],
        prep_time_minutes: 5,
        cook_time_minutes: 15,
        servings: 1,
        category: 'dessert',
        user_id: user1Id
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // User2 favorites the recipe
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: user2Id,
        recipe_id: recipeId
      })
      .execute();

    // Get the recipe from user2's perspective (favorited)
    const result = await getRecipeById(recipeId, user2Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Favorited Recipe');
    expect(result!.user_name).toEqual('User One');
    expect(result!.is_favorite).toEqual(true);
  });

  it('should handle recipe with nullable fields', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a recipe with minimal required fields only
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null, // Nullable field
        ingredients: ['single ingredient'],
        instructions: ['single instruction'],
        prep_time_minutes: null, // Nullable field
        cook_time_minutes: null, // Nullable field
        servings: null, // Nullable field
        category: 'snack',
        user_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Get the recipe
    const result = await getRecipeById(recipeId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Minimal Recipe');
    expect(result!.description).toBeNull();
    expect(result!.ingredients).toEqual(['single ingredient']);
    expect(result!.instructions).toEqual(['single instruction']);
    expect(result!.prep_time_minutes).toBeNull();
    expect(result!.cook_time_minutes).toBeNull();
    expect(result!.servings).toBeNull();
    expect(result!.category).toEqual('snack');
    expect(result!.user_name).toEqual('Test User');
  });

  it('should handle multiple recipes and return correct one', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create multiple recipes
    const recipe1Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 1',
        description: 'First recipe',
        ingredients: ['ingredient 1'],
        instructions: ['instruction 1'],
        category: 'breakfast',
        user_id: userId
      })
      .returning()
      .execute();

    const recipe2Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 2',
        description: 'Second recipe',
        ingredients: ['ingredient 2'],
        instructions: ['instruction 2'],
        category: 'lunch',
        user_id: userId
      })
      .returning()
      .execute();

    const recipe1Id = recipe1Result[0].id;
    const recipe2Id = recipe2Result[0].id;

    // Get the second recipe specifically
    const result = await getRecipeById(recipe2Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipe2Id);
    expect(result!.title).toEqual('Recipe 2');
    expect(result!.description).toEqual('Second recipe');
    expect(result!.ingredients).toEqual(['ingredient 2']);
    expect(result!.instructions).toEqual(['instruction 2']);
    expect(result!.category).toEqual('lunch');
  });
});
