import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, userFavoritesTable } from '../db/schema';
import { type AddToFavoritesInput } from '../schema';
import { addToFavorites } from '../handlers/add_to_favorites';
import { eq, and } from 'drizzle-orm';


describe('addToFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a test recipe
  const createTestRecipe = async (authorId: number) => {
    const result = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        instructions: 'Mix and cook',
        author_id: authorId
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should add a recipe to favorites successfully', async () => {
    // Create test user and recipe
    const user = await createTestUser();
    const recipe = await createTestRecipe(user.id);

    const input: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await addToFavorites(input);

    // Verify the result
    expect(result.user_id).toBe(user.id);
    expect(result.recipe_id).toBe(recipe.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save favorite to database', async () => {
    // Create test user and recipe
    const user = await createTestUser();
    const recipe = await createTestRecipe(user.id);

    const input: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await addToFavorites(input);

    // Query the database to verify the favorite was saved
    const favorites = await db.select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.id, result.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toBe(user.id);
    expect(favorites[0].recipe_id).toBe(recipe.id);
    expect(favorites[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing favorite if recipe is already in favorites', async () => {
    // Create test user and recipe
    const user = await createTestUser();
    const recipe = await createTestRecipe(user.id);

    const input: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    // Add to favorites first time
    const firstResult = await addToFavorites(input);

    // Add to favorites second time (should return existing)
    const secondResult = await addToFavorites(input);

    // Should return the same favorite record
    expect(secondResult.id).toBe(firstResult.id);
    expect(secondResult.user_id).toBe(firstResult.user_id);
    expect(secondResult.recipe_id).toBe(firstResult.recipe_id);
    expect(secondResult.created_at).toEqual(firstResult.created_at);

    // Verify only one record exists in database
    const allFavorites = await db.select()
      .from(userFavoritesTable)
      .where(and(
        eq(userFavoritesTable.user_id, user.id),
        eq(userFavoritesTable.recipe_id, recipe.id)
      ))
      .execute();

    expect(allFavorites).toHaveLength(1);
  });

  it('should throw error when user does not exist', async () => {
    // Create test recipe with a dummy user first
    const dummyUser = await createTestUser();
    const recipe = await createTestRecipe(dummyUser.id);

    const input: AddToFavoritesInput = {
      user_id: 99999, // Non-existent user ID
      recipe_id: recipe.id
    };

    await expect(addToFavorites(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error when recipe does not exist', async () => {
    // Create test user
    const user = await createTestUser();

    const input: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: 99999 // Non-existent recipe ID
    };

    await expect(addToFavorites(input)).rejects.toThrow(/Recipe with id 99999 not found/i);
  });

  it('should handle multiple users favoriting the same recipe', async () => {
    // Create first user and recipe
    const user1 = await createTestUser();
    const recipe = await createTestRecipe(user1.id);

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashedpassword456'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Both users add the same recipe to favorites
    const input1: AddToFavoritesInput = {
      user_id: user1.id,
      recipe_id: recipe.id
    };

    const input2: AddToFavoritesInput = {
      user_id: user2.id,
      recipe_id: recipe.id
    };

    const favorite1 = await addToFavorites(input1);
    const favorite2 = await addToFavorites(input2);

    // Should create separate favorite records
    expect(favorite1.id).not.toBe(favorite2.id);
    expect(favorite1.user_id).toBe(user1.id);
    expect(favorite2.user_id).toBe(user2.id);
    expect(favorite1.recipe_id).toBe(recipe.id);
    expect(favorite2.recipe_id).toBe(recipe.id);

    // Verify both records exist in database
    const allFavorites = await db.select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.recipe_id, recipe.id))
      .execute();

    expect(allFavorites).toHaveLength(2);
  });

  it('should handle user favoriting multiple recipes', async () => {
    // Create test user
    const user = await createTestUser();

    // Create multiple recipes
    const recipe1 = await createTestRecipe(user.id);
    
    const recipe2Result = await db.insert(recipesTable)
      .values({
        title: 'Second Test Recipe',
        description: 'Another delicious test recipe',
        instructions: 'Chop and bake',
        author_id: user.id
      })
      .returning()
      .execute();
    const recipe2 = recipe2Result[0];

    // Add both recipes to favorites
    const input1: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: recipe1.id
    };

    const input2: AddToFavoritesInput = {
      user_id: user.id,
      recipe_id: recipe2.id
    };

    const favorite1 = await addToFavorites(input1);
    const favorite2 = await addToFavorites(input2);

    // Should create separate favorite records
    expect(favorite1.id).not.toBe(favorite2.id);
    expect(favorite1.recipe_id).toBe(recipe1.id);
    expect(favorite2.recipe_id).toBe(recipe2.id);
    expect(favorite1.user_id).toBe(user.id);
    expect(favorite2.user_id).toBe(user.id);

    // Verify both records exist in database
    const userFavorites = await db.select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.user_id, user.id))
      .execute();

    expect(userFavorites).toHaveLength(2);
  });
});
