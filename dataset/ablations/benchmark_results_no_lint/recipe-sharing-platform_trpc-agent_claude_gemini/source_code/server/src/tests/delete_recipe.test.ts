import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { deleteRecipe } from '../handlers/delete_recipe';
import { eq } from 'drizzle-orm';

describe('deleteRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete recipe successfully when user owns it', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 4,
        category: 'main_course',
        user_id: userId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Delete the recipe
    const result = await deleteRecipe(recipeId, userId);

    expect(result).toBe(true);

    // Verify recipe is deleted from database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    expect(recipes).toHaveLength(0);
  });

  it('should return false when recipe does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Try to delete non-existent recipe
    const result = await deleteRecipe(999, userId);

    expect(result).toBe(false);
  });

  it('should return false when user does not own the recipe', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create recipe owned by user1
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'User 1 Recipe',
        description: 'Recipe by user 1',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        category: 'main_course',
        user_id: user1Id
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Try to delete recipe with user2 (unauthorized)
    const result = await deleteRecipe(recipeId, user2Id);

    expect(result).toBe(false);

    // Verify recipe still exists
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    expect(recipes).toHaveLength(1);
  });

  it('should delete associated favorite records when deleting recipe', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create recipe owned by user1
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Favorite Recipe',
        description: 'A recipe to be favorited',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
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

    // Verify favorite exists
    const favoritesBefore = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, recipeId))
      .execute();
    expect(favoritesBefore).toHaveLength(1);

    // Delete the recipe (as user1, the owner)
    const result = await deleteRecipe(recipeId, user1Id);

    expect(result).toBe(true);

    // Verify recipe is deleted
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();
    expect(recipes).toHaveLength(0);

    // Verify associated favorite record is also deleted
    const favoritesAfter = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, recipeId))
      .execute();
    expect(favoritesAfter).toHaveLength(0);
  });

  it('should handle multiple favorite records correctly', async () => {
    // Create multiple users
    const users = [];
    for (let i = 0; i < 3; i++) {
      const userResult = await db.insert(usersTable)
        .values({
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          name: `User ${i}`
        })
        .returning()
        .execute();
      users.push(userResult[0]);
    }

    // Create recipe owned by first user
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Popular Recipe',
        description: 'A recipe favorited by many',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        category: 'snack',
        user_id: users[0].id
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // All users (including owner) favorite the recipe
    for (const user of users) {
      await db.insert(favoriteRecipesTable)
        .values({
          user_id: user.id,
          recipe_id: recipeId
        })
        .execute();
    }

    // Verify all favorites exist
    const favoritesBefore = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, recipeId))
      .execute();
    expect(favoritesBefore).toHaveLength(3);

    // Delete the recipe
    const result = await deleteRecipe(recipeId, users[0].id);

    expect(result).toBe(true);

    // Verify all favorite records are deleted
    const favoritesAfter = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, recipeId))
      .execute();
    expect(favoritesAfter).toHaveLength(0);
  });
});
