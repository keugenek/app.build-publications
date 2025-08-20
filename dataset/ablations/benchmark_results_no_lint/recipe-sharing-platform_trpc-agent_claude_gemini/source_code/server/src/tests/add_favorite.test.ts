import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { type ManageFavoriteInput } from '../schema';
import { addFavorite } from '../handlers/add_favorite';
import { eq, and } from 'drizzle-orm';

describe('addFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testRecipeId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create a test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        category: 'main_course',
        user_id: testUserId
      })
      .returning()
      .execute();

    testRecipeId = recipeResult[0].id;
  });

  it('should add a favorite recipe successfully', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    const result = await addFavorite(input);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.recipe_id).toEqual(testRecipeId);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should save favorite to database', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    const result = await addFavorite(input);
    
    // Verify it was saved to database
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.id, result!.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toEqual(testUserId);
    expect(favorites[0].recipe_id).toEqual(testRecipeId);
    expect(favorites[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null if recipe does not exist', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: 99999 // Non-existent recipe ID
    };

    const result = await addFavorite(input);

    expect(result).toBeNull();
  });

  it('should return null if recipe is already favorited', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Add favorite first time
    const firstResult = await addFavorite(input);
    expect(firstResult).not.toBeNull();

    // Try to add same favorite again
    const secondResult = await addFavorite(input);
    expect(secondResult).toBeNull();
  });

  it('should not create duplicate favorites in database', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Add favorite first time
    await addFavorite(input);
    
    // Try to add same favorite again
    await addFavorite(input);

    // Verify only one favorite exists in database
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(and(
        eq(favoriteRecipesTable.user_id, testUserId),
        eq(favoriteRecipesTable.recipe_id, testRecipeId)
      ))
      .execute();

    expect(favorites).toHaveLength(1);
  });

  it('should allow different users to favorite the same recipe', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashedpassword2',
        name: 'Test User 2'
      })
      .returning()
      .execute();
    
    const secondUserId = secondUserResult[0].id;

    // First user favorites recipe
    const firstInput: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };
    const firstResult = await addFavorite(firstInput);
    expect(firstResult).not.toBeNull();

    // Second user favorites same recipe
    const secondInput: ManageFavoriteInput = {
      user_id: secondUserId,
      recipe_id: testRecipeId
    };
    const secondResult = await addFavorite(secondInput);
    expect(secondResult).not.toBeNull();

    // Verify both favorites exist in database
    const allFavorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, testRecipeId))
      .execute();

    expect(allFavorites).toHaveLength(2);
  });

  it('should allow same user to favorite different recipes', async () => {
    // Create second recipe
    const secondRecipeResult = await db.insert(recipesTable)
      .values({
        title: 'Second Test Recipe',
        description: 'Another test recipe',
        ingredients: ['ingredient3', 'ingredient4'],
        instructions: ['step3', 'step4'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 2,
        category: 'dessert',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    const secondRecipeId = secondRecipeResult[0].id;

    // User favorites first recipe
    const firstInput: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };
    const firstResult = await addFavorite(firstInput);
    expect(firstResult).not.toBeNull();

    // User favorites second recipe
    const secondInput: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: secondRecipeId
    };
    const secondResult = await addFavorite(secondInput);
    expect(secondResult).not.toBeNull();

    // Verify both favorites exist in database
    const userFavorites = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.user_id, testUserId))
      .execute();

    expect(userFavorites).toHaveLength(2);
  });
});
