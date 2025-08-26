import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, savedRecipesTable } from '../db/schema';
import { type SaveRecipeInput } from '../schema';
import { saveRecipe } from '../handlers/save_recipe';
import { eq, and } from 'drizzle-orm';

describe('saveRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testRecipe: any;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create a test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A recipe for testing',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        categories: ['breakfast'],
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 4,
        difficulty: 'easy',
        author_id: testUser.id
      })
      .returning()
      .execute();
    testRecipe = recipeResult[0];
  });

  it('should save a recipe to user collection', async () => {
    const input: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: testRecipe.id
    };

    const result = await saveRecipe(input);

    // Verify the saved recipe structure
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUser.id);
    expect(result.recipe_id).toEqual(testRecipe.id);
    expect(result.saved_at).toBeInstanceOf(Date);
  });

  it('should save recipe to database', async () => {
    const input: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: testRecipe.id
    };

    const result = await saveRecipe(input);

    // Verify it was saved to the database
    const savedRecipes = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.id, result.id))
      .execute();

    expect(savedRecipes).toHaveLength(1);
    expect(savedRecipes[0].user_id).toEqual(testUser.id);
    expect(savedRecipes[0].recipe_id).toEqual(testRecipe.id);
    expect(savedRecipes[0].saved_at).toBeInstanceOf(Date);
  });

  it('should return existing record if recipe already saved', async () => {
    const input: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: testRecipe.id
    };

    // Save the recipe first time
    const firstResult = await saveRecipe(input);

    // Save the same recipe again
    const secondResult = await saveRecipe(input);

    // Should return the same record
    expect(firstResult.id).toEqual(secondResult.id);
    expect(firstResult.user_id).toEqual(secondResult.user_id);
    expect(firstResult.recipe_id).toEqual(secondResult.recipe_id);
    expect(firstResult.saved_at).toEqual(secondResult.saved_at);

    // Verify only one record exists in database
    const savedRecipes = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, testUser.id),
          eq(savedRecipesTable.recipe_id, testRecipe.id)
        )
      )
      .execute();

    expect(savedRecipes).toHaveLength(1);
  });

  it('should throw error if user does not exist', async () => {
    const input: SaveRecipeInput = {
      user_id: 99999, // Non-existent user ID
      recipe_id: testRecipe.id
    };

    expect(saveRecipe(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error if recipe does not exist', async () => {
    const input: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: 99999 // Non-existent recipe ID
    };

    expect(saveRecipe(input)).rejects.toThrow(/recipe not found/i);
  });

  it('should allow different users to save the same recipe', async () => {
    // Create a second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();
    const secondUser = secondUserResult[0];

    // Both users save the same recipe
    const firstInput: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: testRecipe.id
    };

    const secondInput: SaveRecipeInput = {
      user_id: secondUser.id,
      recipe_id: testRecipe.id
    };

    const firstResult = await saveRecipe(firstInput);
    const secondResult = await saveRecipe(secondInput);

    // Should be different saved recipe records
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.user_id).toEqual(testUser.id);
    expect(secondResult.user_id).toEqual(secondUser.id);
    expect(firstResult.recipe_id).toEqual(testRecipe.id);
    expect(secondResult.recipe_id).toEqual(testRecipe.id);

    // Verify both records exist in database
    const allSavedRecipes = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, testRecipe.id))
      .execute();

    expect(allSavedRecipes).toHaveLength(2);
  });

  it('should allow same user to save different recipes', async () => {
    // Create a second recipe
    const secondRecipeResult = await db.insert(recipesTable)
      .values({
        title: 'Second Test Recipe',
        description: 'Another recipe for testing',
        ingredients: ['ingredient3', 'ingredient4'],
        instructions: ['step3', 'step4'],
        categories: ['lunch'],
        prep_time_minutes: 20,
        cook_time_minutes: 25,
        servings: 2,
        difficulty: 'medium',
        author_id: testUser.id
      })
      .returning()
      .execute();
    const secondRecipe = secondRecipeResult[0];

    // User saves both recipes
    const firstInput: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: testRecipe.id
    };

    const secondInput: SaveRecipeInput = {
      user_id: testUser.id,
      recipe_id: secondRecipe.id
    };

    const firstResult = await saveRecipe(firstInput);
    const secondResult = await saveRecipe(secondInput);

    // Should be different saved recipe records
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.user_id).toEqual(testUser.id);
    expect(secondResult.user_id).toEqual(testUser.id);
    expect(firstResult.recipe_id).toEqual(testRecipe.id);
    expect(secondResult.recipe_id).toEqual(secondRecipe.id);

    // Verify both records exist in database
    const userSavedRecipes = await db.select()
      .from(savedRecipesTable)
      .where(eq(savedRecipesTable.user_id, testUser.id))
      .execute();

    expect(userSavedRecipes).toHaveLength(2);
  });
});
