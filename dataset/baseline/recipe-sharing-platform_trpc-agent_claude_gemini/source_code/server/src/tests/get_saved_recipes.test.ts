import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, savedRecipesTable } from '../db/schema';
import { type GetSavedRecipesInput, type CreateUserInput, type CreateRecipeInput } from '../schema';
import { getSavedRecipes } from '../handlers/get_saved_recipes';

describe('getSavedRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no saved recipes', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const input: GetSavedRecipesInput = {
      user_id: userResult[0].id
    };

    const result = await getSavedRecipes(input);

    expect(result).toEqual([]);
  });

  it('should return saved recipes for a user', async () => {
    // Create users
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'testuser', email: 'test@example.com' },
        { username: 'author', email: 'author@example.com' }
      ])
      .returning()
      .execute();

    const userId = userResult[0].id;
    const authorId = userResult[1].id;

    // Create recipes
    const recipeResult = await db.insert(recipesTable)
      .values([
        {
          title: 'Chocolate Cake',
          description: 'Delicious chocolate cake',
          ingredients: ['flour', 'chocolate', 'eggs'],
          instructions: ['Mix ingredients', 'Bake for 30 minutes'],
          categories: ['dessert', 'comfort_food'],
          prep_time_minutes: 20,
          cook_time_minutes: 30,
          servings: 8,
          difficulty: 'medium',
          author_id: authorId
        },
        {
          title: 'Caesar Salad',
          description: 'Fresh caesar salad',
          ingredients: ['lettuce', 'croutons', 'dressing'],
          instructions: ['Chop lettuce', 'Add croutons and dressing'],
          categories: ['salad', 'healthy'],
          prep_time_minutes: 10,
          cook_time_minutes: null,
          servings: 2,
          difficulty: 'easy',
          author_id: authorId
        }
      ])
      .returning()
      .execute();

    const recipe1Id = recipeResult[0].id;
    const recipe2Id = recipeResult[1].id;

    // Save recipes for the user
    await db.insert(savedRecipesTable)
      .values([
        {
          user_id: userId,
          recipe_id: recipe1Id
        },
        {
          user_id: userId,
          recipe_id: recipe2Id
        }
      ])
      .execute();

    const input: GetSavedRecipesInput = {
      user_id: userId
    };

    const result = await getSavedRecipes(input);

    expect(result).toHaveLength(2);
    
    // Check recipe details
    const chocolateCake = result.find(r => r.title === 'Chocolate Cake');
    expect(chocolateCake).toBeDefined();
    expect(chocolateCake!.description).toBe('Delicious chocolate cake');
    expect(chocolateCake!.ingredients).toEqual(['flour', 'chocolate', 'eggs']);
    expect(chocolateCake!.instructions).toEqual(['Mix ingredients', 'Bake for 30 minutes']);
    expect(chocolateCake!.categories).toEqual(['dessert', 'comfort_food']);
    expect(chocolateCake!.prep_time_minutes).toBe(20);
    expect(chocolateCake!.cook_time_minutes).toBe(30);
    expect(chocolateCake!.servings).toBe(8);
    expect(chocolateCake!.difficulty).toBe('medium');
    expect(chocolateCake!.author_id).toBe(authorId);
    expect(chocolateCake!.created_at).toBeInstanceOf(Date);
    expect(chocolateCake!.updated_at).toBeInstanceOf(Date);

    const caesarSalad = result.find(r => r.title === 'Caesar Salad');
    expect(caesarSalad).toBeDefined();
    expect(caesarSalad!.description).toBe('Fresh caesar salad');
    expect(caesarSalad!.ingredients).toEqual(['lettuce', 'croutons', 'dressing']);
    expect(caesarSalad!.instructions).toEqual(['Chop lettuce', 'Add croutons and dressing']);
    expect(caesarSalad!.categories).toEqual(['salad', 'healthy']);
    expect(caesarSalad!.prep_time_minutes).toBe(10);
    expect(caesarSalad!.cook_time_minutes).toBe(null);
    expect(caesarSalad!.servings).toBe(2);
    expect(caesarSalad!.difficulty).toBe('easy');
    expect(caesarSalad!.author_id).toBe(authorId);
  });

  it('should return recipes ordered by saved_at timestamp (most recent first)', async () => {
    // Create user and author
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'testuser', email: 'test@example.com' },
        { username: 'author', email: 'author@example.com' }
      ])
      .returning()
      .execute();

    const userId = userResult[0].id;
    const authorId = userResult[1].id;

    // Create recipes
    const recipeResult = await db.insert(recipesTable)
      .values([
        {
          title: 'First Recipe',
          description: 'First recipe saved',
          ingredients: ['ingredient1'],
          instructions: ['instruction1'],
          categories: ['breakfast'],
          author_id: authorId
        },
        {
          title: 'Second Recipe',
          description: 'Second recipe saved',
          ingredients: ['ingredient2'],
          instructions: ['instruction2'],
          categories: ['lunch'],
          author_id: authorId
        },
        {
          title: 'Third Recipe',
          description: 'Third recipe saved',
          ingredients: ['ingredient3'],
          instructions: ['instruction3'],
          categories: ['dinner'],
          author_id: authorId
        }
      ])
      .returning()
      .execute();

    // Save recipes with small delays to ensure different timestamps
    await db.insert(savedRecipesTable)
      .values({
        user_id: userId,
        recipe_id: recipeResult[0].id
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(savedRecipesTable)
      .values({
        user_id: userId,
        recipe_id: recipeResult[1].id
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(savedRecipesTable)
      .values({
        user_id: userId,
        recipe_id: recipeResult[2].id
      })
      .execute();

    const input: GetSavedRecipesInput = {
      user_id: userId
    };

    const result = await getSavedRecipes(input);

    expect(result).toHaveLength(3);
    
    // Verify order - most recently saved first
    expect(result[0].title).toBe('Third Recipe');
    expect(result[1].title).toBe('Second Recipe');
    expect(result[2].title).toBe('First Recipe');
  });

  it('should not return recipes saved by other users', async () => {
    // Create two users and an author
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' },
        { username: 'author', email: 'author@example.com' }
      ])
      .returning()
      .execute();

    const user1Id = userResult[0].id;
    const user2Id = userResult[1].id;
    const authorId = userResult[2].id;

    // Create a recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Shared Recipe',
        description: 'A recipe that both users might save',
        ingredients: ['ingredient1'],
        instructions: ['instruction1'],
        categories: ['main_course'],
        author_id: authorId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // User 1 saves the recipe
    await db.insert(savedRecipesTable)
      .values({
        user_id: user1Id,
        recipe_id: recipeId
      })
      .execute();

    // User 2 saves the recipe
    await db.insert(savedRecipesTable)
      .values({
        user_id: user2Id,
        recipe_id: recipeId
      })
      .execute();

    // Get saved recipes for user 1
    const input1: GetSavedRecipesInput = {
      user_id: user1Id
    };

    const result1 = await getSavedRecipes(input1);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toBe('Shared Recipe');

    // Get saved recipes for user 2
    const input2: GetSavedRecipesInput = {
      user_id: user2Id
    };

    const result2 = await getSavedRecipes(input2);
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toBe('Shared Recipe');

    // Verify both results are the same recipe but isolated per user
    expect(result1[0].id).toBe(result2[0].id);
  });

  it('should handle recipes with null optional fields', async () => {
    // Create user and author
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'testuser', email: 'test@example.com' },
        { username: 'author', email: 'author@example.com' }
      ])
      .returning()
      .execute();

    const userId = userResult[0].id;
    const authorId = userResult[1].id;

    // Create recipe with minimal required fields (nullable fields left null)
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null,
        ingredients: ['water'],
        instructions: ['Drink water'],
        categories: ['beverage'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        difficulty: null,
        author_id: authorId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Save the recipe
    await db.insert(savedRecipesTable)
      .values({
        user_id: userId,
        recipe_id: recipeId
      })
      .execute();

    const input: GetSavedRecipesInput = {
      user_id: userId
    };

    const result = await getSavedRecipes(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Minimal Recipe');
    expect(result[0].description).toBe(null);
    expect(result[0].prep_time_minutes).toBe(null);
    expect(result[0].cook_time_minutes).toBe(null);
    expect(result[0].servings).toBe(null);
    expect(result[0].difficulty).toBe(null);
    expect(result[0].ingredients).toEqual(['water']);
    expect(result[0].instructions).toEqual(['Drink water']);
    expect(result[0].categories).toEqual(['beverage']);
  });
});
