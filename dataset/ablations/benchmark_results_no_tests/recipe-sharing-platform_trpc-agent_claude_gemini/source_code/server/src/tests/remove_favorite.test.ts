import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { type RemoveFavoriteInput } from '../schema';
import { removeFavorite } from '../handlers/remove_favorite';
import { eq, and } from 'drizzle-orm';

describe('removeFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test data
  const createTestData = async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

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
        user_id: user[0].id
      })
      .returning()
      .execute();

    // Create favorite record
    const favorite = await db.insert(favoriteRecipesTable)
      .values({
        user_id: user[0].id,
        recipe_id: recipe[0].id
      })
      .returning()
      .execute();

    return {
      user: user[0],
      recipe: recipe[0],
      favorite: favorite[0]
    };
  };

  it('should remove an existing favorite and return true', async () => {
    const { user, recipe } = await createTestData();

    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await removeFavorite(input);

    expect(result).toBe(true);
  });

  it('should delete the favorite record from database', async () => {
    const { user, recipe } = await createTestData();

    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    await removeFavorite(input);

    // Verify the favorite record was deleted
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, user.id),
          eq(favoriteRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(favorites).toHaveLength(0);
  });

  it('should return false when favorite does not exist', async () => {
    const { user, recipe } = await createTestData();

    // Use a different recipe ID that doesn't exist in favorites
    const anotherRecipe = await db.insert(recipesTable)
      .values({
        title: 'Another Recipe',
        description: 'Another test recipe',
        ingredients: ['ingredient3'],
        instructions: ['step3'],
        user_id: user.id
      })
      .returning()
      .execute();

    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: anotherRecipe[0].id
    };

    const result = await removeFavorite(input);

    expect(result).toBe(false);
  });

  it('should return false when user does not exist', async () => {
    const { recipe } = await createTestData();

    const input: RemoveFavoriteInput = {
      user_id: 99999, // Non-existent user ID
      recipe_id: recipe.id
    };

    const result = await removeFavorite(input);

    expect(result).toBe(false);
  });

  it('should return false when recipe does not exist', async () => {
    const { user } = await createTestData();

    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: 99999 // Non-existent recipe ID
    };

    const result = await removeFavorite(input);

    expect(result).toBe(false);
  });

  it('should not affect other users favorites', async () => {
    const { user, recipe } = await createTestData();

    // Create another user with same recipe as favorite
    const anotherUser = await db.insert(usersTable)
      .values({
        username: 'anotheruser',
        email: 'another@example.com'
      })
      .returning()
      .execute();

    await db.insert(favoriteRecipesTable)
      .values({
        user_id: anotherUser[0].id,
        recipe_id: recipe.id
      })
      .execute();

    // Remove favorite for first user
    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    await removeFavorite(input);

    // Verify second user's favorite still exists
    const remainingFavorites = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, anotherUser[0].id),
          eq(favoriteRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(remainingFavorites).toHaveLength(1);
  });

  it('should handle multiple remove attempts gracefully', async () => {
    const { user, recipe } = await createTestData();

    const input: RemoveFavoriteInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    // First removal should succeed
    const firstResult = await removeFavorite(input);
    expect(firstResult).toBe(true);

    // Second removal should return false (already removed)
    const secondResult = await removeFavorite(input);
    expect(secondResult).toBe(false);

    // Verify no records exist
    const favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, user.id),
          eq(favoriteRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(favorites).toHaveLength(0);
  });
});
