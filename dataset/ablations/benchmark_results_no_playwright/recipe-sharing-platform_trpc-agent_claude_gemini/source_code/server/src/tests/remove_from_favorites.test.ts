import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, userFavoritesTable } from '../db/schema';
import { type RemoveFromFavoritesInput } from '../schema';
import { removeFromFavorites } from '../handlers/remove_from_favorites';
import { eq, and } from 'drizzle-orm';

describe('removeFromFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove a recipe from user favorites', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        instructions: 'Mix ingredients',
        author_id: userResult[0].id
      })
      .returning()
      .execute();

    // Add recipe to favorites first
    await db.insert(userFavoritesTable)
      .values({
        user_id: userResult[0].id,
        recipe_id: recipeResult[0].id
      })
      .execute();

    const input: RemoveFromFavoritesInput = {
      user_id: userResult[0].id,
      recipe_id: recipeResult[0].id
    };

    const result = await removeFromFavorites(input);

    expect(result.success).toBe(true);

    // Verify the favorite was actually removed from database
    const remainingFavorites = await db.select()
      .from(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.user_id, userResult[0].id),
          eq(userFavoritesTable.recipe_id, recipeResult[0].id)
        )
      )
      .execute();

    expect(remainingFavorites).toHaveLength(0);
  });

  it('should handle removing non-existent favorite gracefully', async () => {
    // Create prerequisite data but don't add to favorites
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        instructions: 'Mix ingredients',
        author_id: userResult[0].id
      })
      .returning()
      .execute();

    const input: RemoveFromFavoritesInput = {
      user_id: userResult[0].id,
      recipe_id: recipeResult[0].id
    };

    const result = await removeFromFavorites(input);

    // Should succeed even though favorite didn't exist
    expect(result.success).toBe(true);

    // Verify no favorites exist
    const favorites = await db.select()
      .from(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.user_id, userResult[0].id),
          eq(userFavoritesTable.recipe_id, recipeResult[0].id)
        )
      )
      .execute();

    expect(favorites).toHaveLength(0);
  });

  it('should only remove specific user-recipe combination', async () => {
    // Create two users and two recipes
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password2'
      })
      .returning()
      .execute();

    const recipe1Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 1',
        description: 'First recipe',
        instructions: 'Instructions 1',
        author_id: user1Result[0].id
      })
      .returning()
      .execute();

    const recipe2Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 2',
        description: 'Second recipe',
        instructions: 'Instructions 2',
        author_id: user1Result[0].id
      })
      .returning()
      .execute();

    // Add multiple favorites
    await db.insert(userFavoritesTable)
      .values([
        {
          user_id: user1Result[0].id,
          recipe_id: recipe1Result[0].id
        },
        {
          user_id: user1Result[0].id,
          recipe_id: recipe2Result[0].id
        },
        {
          user_id: user2Result[0].id,
          recipe_id: recipe1Result[0].id
        }
      ])
      .execute();

    // Remove only user1's favorite for recipe1
    const input: RemoveFromFavoritesInput = {
      user_id: user1Result[0].id,
      recipe_id: recipe1Result[0].id
    };

    const result = await removeFromFavorites(input);

    expect(result.success).toBe(true);

    // Verify only the specific favorite was removed
    const user1Recipe1Favorites = await db.select()
      .from(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.user_id, user1Result[0].id),
          eq(userFavoritesTable.recipe_id, recipe1Result[0].id)
        )
      )
      .execute();

    expect(user1Recipe1Favorites).toHaveLength(0);

    // Verify other favorites still exist
    const remainingFavorites = await db.select()
      .from(userFavoritesTable)
      .execute();

    expect(remainingFavorites).toHaveLength(2);

    // Verify user1's recipe2 favorite still exists
    const user1Recipe2Favorites = remainingFavorites.filter(
      fav => fav.user_id === user1Result[0].id && fav.recipe_id === recipe2Result[0].id
    );
    expect(user1Recipe2Favorites).toHaveLength(1);

    // Verify user2's recipe1 favorite still exists
    const user2Recipe1Favorites = remainingFavorites.filter(
      fav => fav.user_id === user2Result[0].id && fav.recipe_id === recipe1Result[0].id
    );
    expect(user2Recipe1Favorites).toHaveLength(1);
  });

  it('should be idempotent when called multiple times', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        instructions: 'Mix ingredients',
        author_id: userResult[0].id
      })
      .returning()
      .execute();

    // Add recipe to favorites first
    await db.insert(userFavoritesTable)
      .values({
        user_id: userResult[0].id,
        recipe_id: recipeResult[0].id
      })
      .execute();

    const input: RemoveFromFavoritesInput = {
      user_id: userResult[0].id,
      recipe_id: recipeResult[0].id
    };

    // Remove favorite first time
    const result1 = await removeFromFavorites(input);
    expect(result1.success).toBe(true);

    // Remove favorite second time (should still succeed)
    const result2 = await removeFromFavorites(input);
    expect(result2.success).toBe(true);

    // Remove favorite third time (should still succeed)
    const result3 = await removeFromFavorites(input);
    expect(result3.success).toBe(true);

    // Verify no favorites exist
    const favorites = await db.select()
      .from(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.user_id, userResult[0].id),
          eq(userFavoritesTable.recipe_id, recipeResult[0].id)
        )
      )
      .execute();

    expect(favorites).toHaveLength(0);
  });
});
