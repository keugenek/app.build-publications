import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { type AddFavoriteInput } from '../schema';
import { addFavorite } from '../handlers/add_favorite';
import { eq, and } from 'drizzle-orm';

describe('addFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testRecipeId: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test recipe
    const recipe = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        user_id: testUserId
      })
      .returning()
      .execute();
    testRecipeId = recipe[0].id;
  });

  const testInput: AddFavoriteInput = {
    user_id: 0, // Will be set in beforeEach
    recipe_id: 0 // Will be set in beforeEach
  };

  it('should add a recipe to user favorites', async () => {
    const input = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    const result = await addFavorite(input);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.recipe_id).toEqual(testRecipeId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save favorite to database', async () => {
    const input = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    const result = await addFavorite(input);

    // Query database to verify favorite was created
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.id, result.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toEqual(testUserId);
    expect(favorites[0].recipe_id).toEqual(testRecipeId);
    expect(favorites[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error if user does not exist', async () => {
    const input = {
      user_id: 99999, // Non-existent user ID
      recipe_id: testRecipeId
    };

    await expect(addFavorite(input)).rejects.toThrow(/User with ID 99999 not found/i);
  });

  it('should throw error if recipe does not exist', async () => {
    const input = {
      user_id: testUserId,
      recipe_id: 99999 // Non-existent recipe ID
    };

    await expect(addFavorite(input)).rejects.toThrow(/Recipe with ID 99999 not found/i);
  });

  it('should throw error if recipe is already favorited', async () => {
    const input = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Add favorite first time
    await addFavorite(input);

    // Try to add same favorite again
    await expect(addFavorite(input)).rejects.toThrow(/Recipe is already in user's favorites/i);
  });

  it('should allow different users to favorite the same recipe', async () => {
    // Create second user
    const user2 = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();
    const testUserId2 = user2[0].id;

    // First user favorites recipe
    const input1 = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };
    const result1 = await addFavorite(input1);

    // Second user favorites same recipe
    const input2 = {
      user_id: testUserId2,
      recipe_id: testRecipeId
    };
    const result2 = await addFavorite(input2);

    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId2);
    expect(result1.recipe_id).toEqual(testRecipeId);
    expect(result2.recipe_id).toEqual(testRecipeId);

    // Verify both favorites exist in database
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, testRecipeId))
      .execute();

    expect(favorites).toHaveLength(2);
  });

  it('should allow same user to favorite different recipes', async () => {
    // Create second recipe
    const recipe2 = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe 2',
        description: 'Another test recipe',
        ingredients: ['ingredient3', 'ingredient4'],
        instructions: ['step3', 'step4'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 2,
        user_id: testUserId
      })
      .returning()
      .execute();
    const testRecipeId2 = recipe2[0].id;

    // User favorites first recipe
    const input1 = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };
    const result1 = await addFavorite(input1);

    // User favorites second recipe
    const input2 = {
      user_id: testUserId,
      recipe_id: testRecipeId2
    };
    const result2 = await addFavorite(input2);

    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.recipe_id).toEqual(testRecipeId);
    expect(result2.recipe_id).toEqual(testRecipeId2);

    // Verify both favorites exist in database
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.user_id, testUserId))
      .execute();

    expect(favorites).toHaveLength(2);
  });
});
