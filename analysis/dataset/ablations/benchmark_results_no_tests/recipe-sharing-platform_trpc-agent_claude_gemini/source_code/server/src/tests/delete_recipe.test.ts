import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, categoriesTable, recipeCategoriesTable, favoriteRecipesTable } from '../db/schema';
import { deleteRecipe } from '../handlers/delete_recipe';
import { eq } from 'drizzle-orm';

describe('deleteRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testRecipeId: number;
  let otherUserRecipeId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { username: 'testuser', email: 'test@example.com' },
        { username: 'otheruser', email: 'other@example.com' }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test recipes
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'User Recipe',
          description: 'A recipe by test user',
          ingredients: ['ingredient1', 'ingredient2'],
          instructions: ['step1', 'step2'],
          prep_time_minutes: 30,
          cook_time_minutes: 45,
          servings: 4,
          user_id: testUserId
        },
        {
          title: 'Other User Recipe',
          description: 'A recipe by other user',
          ingredients: ['ingredient3', 'ingredient4'],
          instructions: ['step3', 'step4'],
          prep_time_minutes: 20,
          cook_time_minutes: 30,
          servings: 2,
          user_id: otherUserId
        }
      ])
      .returning()
      .execute();

    testRecipeId = recipes[0].id;
    otherUserRecipeId = recipes[1].id;
  });

  it('should delete recipe when user owns it', async () => {
    const result = await deleteRecipe(testRecipeId, testUserId);

    expect(result).toBe(true);

    // Verify recipe was deleted from database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    expect(recipes).toHaveLength(0);
  });

  it('should not delete recipe when user does not own it', async () => {
    const result = await deleteRecipe(testRecipeId, otherUserId);

    expect(result).toBe(false);

    // Verify recipe still exists in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('User Recipe');
  });

  it('should return false when recipe does not exist', async () => {
    const nonExistentRecipeId = 99999;
    const result = await deleteRecipe(nonExistentRecipeId, testUserId);

    expect(result).toBe(false);

    // Verify original recipes still exist
    const recipes = await db.select()
      .from(recipesTable)
      .execute();

    expect(recipes).toHaveLength(2);
  });

  it('should cascade delete related recipe categories', async () => {
    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'A test category' })
      .returning()
      .execute();
    
    const categoryId = categories[0].id;

    // Associate recipe with category
    await db.insert(recipeCategoriesTable)
      .values({ recipe_id: testRecipeId, category_id: categoryId })
      .execute();

    // Verify association exists
    const recipeCategoriesBefore = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, testRecipeId))
      .execute();
    expect(recipeCategoriesBefore).toHaveLength(1);

    // Delete recipe
    const result = await deleteRecipe(testRecipeId, testUserId);
    expect(result).toBe(true);

    // Verify recipe categories were deleted via cascade
    const recipeCategoriesAfter = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, testRecipeId))
      .execute();
    expect(recipeCategoriesAfter).toHaveLength(0);

    // Verify category itself still exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();
    expect(category).toHaveLength(1);
  });

  it('should cascade delete favorite recipes', async () => {
    // Add recipe to favorites
    await db.insert(favoriteRecipesTable)
      .values({ user_id: otherUserId, recipe_id: testRecipeId })
      .execute();

    // Verify favorite exists
    const favoritesBefore = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, testRecipeId))
      .execute();
    expect(favoritesBefore).toHaveLength(1);

    // Delete recipe
    const result = await deleteRecipe(testRecipeId, testUserId);
    expect(result).toBe(true);

    // Verify favorites were deleted via cascade
    const favoritesAfter = await db.select()
      .from(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, testRecipeId))
      .execute();
    expect(favoritesAfter).toHaveLength(0);
  });

  it('should not affect other users recipes', async () => {
    const result = await deleteRecipe(testRecipeId, testUserId);
    expect(result).toBe(true);

    // Verify other user's recipe still exists
    const otherRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, otherUserRecipeId))
      .execute();

    expect(otherRecipe).toHaveLength(1);
    expect(otherRecipe[0].title).toEqual('Other User Recipe');
  });
});
