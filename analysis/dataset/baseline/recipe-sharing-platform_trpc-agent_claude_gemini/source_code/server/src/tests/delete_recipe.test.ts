import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, savedRecipesTable } from '../db/schema';
import { type DeleteRecipeInput } from '../schema';
import { deleteRecipe } from '../handlers/delete_recipe';
import { eq } from 'drizzle-orm';

describe('deleteRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser = {
    username: 'testchef',
    email: 'test@example.com'
  };

  const otherUser = {
    username: 'otherchef', 
    email: 'other@example.com'
  };

  const testRecipe = {
    title: 'Test Recipe',
    description: 'A recipe for testing deletion',
    ingredients: ['ingredient 1', 'ingredient 2'],
    instructions: ['step 1', 'step 2'],
    categories: ['breakfast', 'healthy'],
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    servings: 4,
    difficulty: 'easy' as const
  };

  it('should successfully delete a recipe by its author', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: userId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    const input: DeleteRecipeInput = {
      id: recipeId,
      author_id: userId
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Recipe ${recipeId} deleted successfully`);

    // Verify recipe is deleted from database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    expect(recipes).toHaveLength(0);
  });

  it('should delete all saved recipe references when deleting a recipe', async () => {
    // Create test users
    const authorResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const authorId = authorResult[0].id;

    const userResult = await db.insert(usersTable)
      .values(otherUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: authorId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Save the recipe by another user
    await db.insert(savedRecipesTable)
      .values({
        user_id: userId,
        recipe_id: recipeId
      })
      .execute();

    // Verify saved recipe exists before deletion
    const savedRecipesBefore = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, recipeId))
      .execute();
    expect(savedRecipesBefore).toHaveLength(1);

    const input: DeleteRecipeInput = {
      id: recipeId,
      author_id: authorId
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(true);

    // Verify saved recipe references are also deleted
    const savedRecipesAfter = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, recipeId))
      .execute();
    expect(savedRecipesAfter).toHaveLength(0);

    // Verify recipe itself is deleted
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();
    expect(recipes).toHaveLength(0);
  });

  it('should fail when recipe does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: DeleteRecipeInput = {
      id: 999, // Non-existent recipe ID
      author_id: userId
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Recipe not found or you are not authorized to delete this recipe');
  });

  it('should fail when user is not the recipe author', async () => {
    // Create test users
    const authorResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const authorId = authorResult[0].id;

    const otherUserResult = await db.insert(usersTable)
      .values(otherUser)
      .returning()
      .execute();
    const otherUserId = otherUserResult[0].id;

    // Create test recipe by first user
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: authorId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    const input: DeleteRecipeInput = {
      id: recipeId,
      author_id: otherUserId // Different user trying to delete
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Recipe not found or you are not authorized to delete this recipe');

    // Verify recipe still exists
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();
    expect(recipes).toHaveLength(1);
  });

  it('should handle deletion of recipe with multiple saved references', async () => {
    // Create test users
    const authorResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const authorId = authorResult[0].id;

    const user1Result = await db.insert(usersTable)
      .values(otherUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'thirdchef',
        email: 'third@example.com'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: authorId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    // Save the recipe by multiple users
    await db.insert(savedRecipesTable)
      .values([
        { user_id: user1Id, recipe_id: recipeId },
        { user_id: user2Id, recipe_id: recipeId }
      ])
      .execute();

    // Verify multiple saved recipes exist
    const savedRecipesBefore = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, recipeId))
      .execute();
    expect(savedRecipesBefore).toHaveLength(2);

    const input: DeleteRecipeInput = {
      id: recipeId,
      author_id: authorId
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(true);

    // Verify all saved recipe references are deleted
    const savedRecipesAfter = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, recipeId))
      .execute();
    expect(savedRecipesAfter).toHaveLength(0);

    // Verify recipe is deleted
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();
    expect(recipes).toHaveLength(0);
  });

  it('should handle deletion of recipe with no saved references', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test recipe (not saved by anyone)
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: userId
      })
      .returning()
      .execute();
    const recipeId = recipeResult[0].id;

    const input: DeleteRecipeInput = {
      id: recipeId,
      author_id: userId
    };

    const result = await deleteRecipe(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Recipe ${recipeId} deleted successfully`);

    // Verify recipe is deleted
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();
    expect(recipes).toHaveLength(0);
  });
});
