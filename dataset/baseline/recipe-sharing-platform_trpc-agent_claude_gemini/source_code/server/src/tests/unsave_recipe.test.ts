import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, savedRecipesTable } from '../db/schema';
import { type UnsaveRecipeInput } from '../schema';
import { unsaveRecipe } from '../handlers/unsave_recipe';
import { eq, and } from 'drizzle-orm';

describe('unsaveRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test setup helper - create required test data
  const setupTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create test recipe author
    const authorResult = await db.insert(usersTable)
      .values({
        username: 'chef',
        email: 'chef@example.com'
      })
      .returning()
      .execute();

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        categories: ['breakfast'],
        author_id: authorResult[0].id
      })
      .returning()
      .execute();

    return {
      user: userResult[0],
      author: authorResult[0],
      recipe: recipeResult[0]
    };
  };

  it('should successfully unsave a recipe', async () => {
    const { user, recipe } = await setupTestData();

    // First save the recipe
    await db.insert(savedRecipesTable)
      .values({
        user_id: user.id,
        recipe_id: recipe.id
      })
      .execute();

    // Verify recipe is saved
    const savedBefore = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(savedBefore).toHaveLength(1);

    // Test unsaving
    const testInput: UnsaveRecipeInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await unsaveRecipe(testInput);

    // Verify successful response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Recipe ${recipe.id} removed from user ${user.id}'s collection`);

    // Verify recipe is no longer saved in database
    const savedAfter = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(savedAfter).toHaveLength(0);
  });

  it('should return failure when trying to unsave a recipe that was not saved', async () => {
    const { user, recipe } = await setupTestData();

    // Don't save the recipe first - attempt to unsave a non-saved recipe
    const testInput: UnsaveRecipeInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await unsaveRecipe(testInput);

    // Verify failure response
    expect(result.success).toBe(false);
    expect(result.message).toEqual(`Recipe ${recipe.id} was not found in user ${user.id}'s saved collection`);

    // Verify no records were affected
    const savedRecords = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(savedRecords).toHaveLength(0);
  });

  it('should only remove the specific user-recipe combination', async () => {
    const { user, recipe } = await setupTestData();

    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        username: 'anotheruser',
        email: 'another@example.com'
      })
      .returning()
      .execute();

    const anotherUser = anotherUserResult[0];

    // Both users save the same recipe
    await db.insert(savedRecipesTable)
      .values([
        {
          user_id: user.id,
          recipe_id: recipe.id
        },
        {
          user_id: anotherUser.id,
          recipe_id: recipe.id
        }
      ])
      .execute();

    // Verify both saved records exist
    const allSavedBefore = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, recipe.id))
      .execute();

    expect(allSavedBefore).toHaveLength(2);

    // Unsave recipe for first user only
    const testInput: UnsaveRecipeInput = {
      user_id: user.id,
      recipe_id: recipe.id
    };

    const result = await unsaveRecipe(testInput);

    expect(result.success).toBe(true);

    // Verify only first user's record was removed
    const firstUserSaved = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(firstUserSaved).toHaveLength(0);

    // Verify second user's record still exists
    const secondUserSaved = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, anotherUser.id),
          eq(savedRecipesTable.recipe_id, recipe.id)
        )
      )
      .execute();

    expect(secondUserSaved).toHaveLength(1);
  });

  it('should handle multiple saved recipes for same user correctly', async () => {
    const { user, author } = await setupTestData();

    // Create multiple recipes
    const recipe1Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 1',
        description: 'First recipe',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        categories: ['breakfast'],
        author_id: author.id
      })
      .returning()
      .execute();

    const recipe2Result = await db.insert(recipesTable)
      .values({
        title: 'Recipe 2',
        description: 'Second recipe',
        ingredients: ['ingredient2'],
        instructions: ['step2'],
        categories: ['lunch'],
        author_id: author.id
      })
      .returning()
      .execute();

    const recipe1 = recipe1Result[0];
    const recipe2 = recipe2Result[0];

    // User saves both recipes
    await db.insert(savedRecipesTable)
      .values([
        {
          user_id: user.id,
          recipe_id: recipe1.id
        },
        {
          user_id: user.id,
          recipe_id: recipe2.id
        }
      ])
      .execute();

    // Unsave first recipe
    const testInput: UnsaveRecipeInput = {
      user_id: user.id,
      recipe_id: recipe1.id
    };

    const result = await unsaveRecipe(testInput);

    expect(result.success).toBe(true);

    // Verify first recipe is unsaved
    const recipe1Saved = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe1.id)
        )
      )
      .execute();

    expect(recipe1Saved).toHaveLength(0);

    // Verify second recipe is still saved
    const recipe2Saved = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, user.id),
          eq(savedRecipesTable.recipe_id, recipe2.id)
        )
      )
      .execute();

    expect(recipe2Saved).toHaveLength(1);
  });

  it('should handle non-existent user and recipe IDs gracefully', async () => {
    // Test with completely non-existent IDs
    const testInput: UnsaveRecipeInput = {
      user_id: 99999,
      recipe_id: 88888
    };

    const result = await unsaveRecipe(testInput);

    // Should return failure (no saved record exists)
    expect(result.success).toBe(false);
    expect(result.message).toEqual(`Recipe 88888 was not found in user 99999's saved collection`);
  });
});
