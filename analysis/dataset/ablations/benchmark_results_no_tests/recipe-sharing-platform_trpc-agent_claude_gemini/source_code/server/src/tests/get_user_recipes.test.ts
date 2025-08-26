import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { getUserRecipes } from '../handlers/get_user_recipes';

describe('getUserRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipes created by specific user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create recipes for the user
    const recipeData = [
      {
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish',
        ingredients: ['pasta', 'eggs', 'bacon', 'parmesan'],
        instructions: ['Cook pasta', 'Mix eggs with cheese', 'Combine all'],
        prep_time_minutes: 15,
        cook_time_minutes: 20,
        servings: 4,
        user_id: user.id
      },
      {
        title: 'Chocolate Cake',
        description: 'Rich chocolate dessert',
        ingredients: ['flour', 'cocoa', 'sugar', 'eggs'],
        instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake'],
        prep_time_minutes: 30,
        cook_time_minutes: 45,
        servings: 8,
        user_id: user.id
      }
    ];

    await db.insert(recipesTable)
      .values(recipeData)
      .execute();

    // Get user recipes
    const recipes = await getUserRecipes(user.id);

    // Verify results
    expect(recipes).toHaveLength(2);
    
    // Check that all recipes belong to the user
    recipes.forEach(recipe => {
      expect(recipe.user_id).toBe(user.id);
      expect(recipe.id).toBeDefined();
      expect(recipe.created_at).toBeInstanceOf(Date);
      expect(recipe.updated_at).toBeInstanceOf(Date);
    });

    // Check specific recipe data
    const pastaRecipe = recipes.find(r => r.title === 'Pasta Carbonara');
    expect(pastaRecipe).toBeDefined();
    expect(pastaRecipe!.description).toBe('Classic Italian pasta dish');
    expect(pastaRecipe!.ingredients).toEqual(['pasta', 'eggs', 'bacon', 'parmesan']);
    expect(pastaRecipe!.instructions).toEqual(['Cook pasta', 'Mix eggs with cheese', 'Combine all']);
    expect(pastaRecipe!.prep_time_minutes).toBe(15);
    expect(pastaRecipe!.cook_time_minutes).toBe(20);
    expect(pastaRecipe!.servings).toBe(4);

    const cakeRecipe = recipes.find(r => r.title === 'Chocolate Cake');
    expect(cakeRecipe).toBeDefined();
    expect(cakeRecipe!.description).toBe('Rich chocolate dessert');
    expect(cakeRecipe!.ingredients).toEqual(['flour', 'cocoa', 'sugar', 'eggs']);
  });

  it('should return recipes ordered by creation date (newest first)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create recipes with slight time differences
    const firstRecipe = await db.insert(recipesTable)
      .values({
        title: 'First Recipe',
        description: null,
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        user_id: user.id
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondRecipe = await db.insert(recipesTable)
      .values({
        title: 'Second Recipe',
        description: null,
        ingredients: ['ingredient2'],
        instructions: ['step2'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        user_id: user.id
      })
      .returning()
      .execute();

    const recipes = await getUserRecipes(user.id);

    expect(recipes).toHaveLength(2);
    // Should be ordered by created_at descending (newest first)
    expect(recipes[0].title).toBe('Second Recipe');
    expect(recipes[1].title).toBe('First Recipe');
    expect(recipes[0].created_at >= recipes[1].created_at).toBe(true);
  });

  it('should return empty array when user has no recipes', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const recipes = await getUserRecipes(user.id);

    expect(recipes).toHaveLength(0);
    expect(Array.isArray(recipes)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const recipes = await getUserRecipes(999);

    expect(recipes).toHaveLength(0);
    expect(Array.isArray(recipes)).toBe(true);
  });

  it('should handle recipes with nullable fields correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create recipe with nullable fields
    await db.insert(recipesTable)
      .values({
        title: 'Simple Recipe',
        description: null, // nullable
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        prep_time_minutes: null, // nullable
        cook_time_minutes: null, // nullable
        servings: null, // nullable
        user_id: user.id
      })
      .execute();

    const recipes = await getUserRecipes(user.id);

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Simple Recipe');
    expect(recipes[0].description).toBeNull();
    expect(recipes[0].prep_time_minutes).toBeNull();
    expect(recipes[0].cook_time_minutes).toBeNull();
    expect(recipes[0].servings).toBeNull();
    expect(recipes[0].ingredients).toEqual(['ingredient1']);
    expect(recipes[0].instructions).toEqual(['step1']);
  });

  it('should not return recipes from other users', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com'
      })
      .returning()
      .execute();

    // Create recipes for both users
    await db.insert(recipesTable)
      .values([
        {
          title: 'User1 Recipe',
          description: 'Recipe by user 1',
          ingredients: ['ingredient1'],
          instructions: ['step1'],
          prep_time_minutes: null,
          cook_time_minutes: null,
          servings: null,
          user_id: user1.id
        },
        {
          title: 'User2 Recipe',
          description: 'Recipe by user 2',
          ingredients: ['ingredient2'],
          instructions: ['step2'],
          prep_time_minutes: null,
          cook_time_minutes: null,
          servings: null,
          user_id: user2.id
        }
      ])
      .execute();

    // Get recipes for user1 only
    const user1Recipes = await getUserRecipes(user1.id);

    expect(user1Recipes).toHaveLength(1);
    expect(user1Recipes[0].title).toBe('User1 Recipe');
    expect(user1Recipes[0].user_id).toBe(user1.id);

    // Get recipes for user2 only
    const user2Recipes = await getUserRecipes(user2.id);

    expect(user2Recipes).toHaveLength(1);
    expect(user2Recipes[0].title).toBe('User2 Recipe');
    expect(user2Recipes[0].user_id).toBe(user2.id);
  });
});
