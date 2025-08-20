import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { type ManageFavoriteInput } from '../schema';
import { removeFavorite } from '../handlers/remove_favorite';
import { eq, and } from 'drizzle-orm';

describe('removeFavorite', () => {
  let testUserId: number;
  let testRecipeId: number;
  let testUserId2: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'testuser@example.com',
          password_hash: 'hashedpassword',
          name: 'Test User'
        },
        {
          email: 'testuser2@example.com',
          password_hash: 'hashedpassword2',
          name: 'Test User 2'
        }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    testUserId2 = users[1].id;

    // Create test recipe
    const recipes = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient 1', 'ingredient 2'],
        instructions: ['step 1', 'step 2'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 4,
        category: 'main_course',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    testRecipeId = recipes[0].id;
  });

  afterEach(resetDB);

  it('should successfully remove an existing favorite', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // First, create a favorite record
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: testUserId,
        recipe_id: testRecipeId
      })
      .execute();

    // Verify favorite exists
    const beforeRemoval = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, testUserId),
          eq(favoriteRecipesTable.recipe_id, testRecipeId)
        )
      )
      .execute();
    
    expect(beforeRemoval).toHaveLength(1);

    // Remove the favorite
    const result = await removeFavorite(input);

    // Should return true for successful removal
    expect(result).toBe(true);

    // Verify favorite no longer exists
    const afterRemoval = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, testUserId),
          eq(favoriteRecipesTable.recipe_id, testRecipeId)
        )
      )
      .execute();
    
    expect(afterRemoval).toHaveLength(0);
  });

  it('should return false when trying to remove non-existent favorite', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Try to remove favorite that doesn't exist
    const result = await removeFavorite(input);

    // Should return false since no favorite was found to remove
    expect(result).toBe(false);
  });

  it('should only remove favorite for specific user-recipe combination', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Create favorites for both users with the same recipe
    await db.insert(favoriteRecipesTable)
      .values([
        {
          user_id: testUserId,
          recipe_id: testRecipeId
        },
        {
          user_id: testUserId2,
          recipe_id: testRecipeId
        }
      ])
      .execute();

    // Remove favorite for first user only
    const result = await removeFavorite(input);

    expect(result).toBe(true);

    // Verify first user's favorite is gone
    const user1Favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, testUserId),
          eq(favoriteRecipesTable.recipe_id, testRecipeId)
        )
      )
      .execute();
    
    expect(user1Favorites).toHaveLength(0);

    // Verify second user's favorite still exists
    const user2Favorites = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, testUserId2),
          eq(favoriteRecipesTable.recipe_id, testRecipeId)
        )
      )
      .execute();
    
    expect(user2Favorites).toHaveLength(1);
  });

  it('should handle invalid user_id gracefully', async () => {
    const input: ManageFavoriteInput = {
      user_id: 99999, // Non-existent user
      recipe_id: testRecipeId
    };

    // Should return false since favorite doesn't exist
    const result = await removeFavorite(input);
    expect(result).toBe(false);
  });

  it('should handle invalid recipe_id gracefully', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: 99999 // Non-existent recipe
    };

    // Should return false since favorite doesn't exist
    const result = await removeFavorite(input);
    expect(result).toBe(false);
  });

  it('should handle multiple removal attempts correctly', async () => {
    const input: ManageFavoriteInput = {
      user_id: testUserId,
      recipe_id: testRecipeId
    };

    // Create a favorite
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: testUserId,
        recipe_id: testRecipeId
      })
      .execute();

    // First removal should succeed
    const firstResult = await removeFavorite(input);
    expect(firstResult).toBe(true);

    // Second removal should return false (already removed)
    const secondResult = await removeFavorite(input);
    expect(secondResult).toBe(false);
  });
});
