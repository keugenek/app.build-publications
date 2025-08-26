import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable, userFavoritesTable } from '../db/schema';
import { deleteRecipe } from '../handlers/delete_recipe';
import { eq } from 'drizzle-orm';

describe('deleteRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a recipe successfully', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create a test recipe
    const recipe = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        instructions: 'Test instructions',
        author_id: user[0].id
      })
      .returning()
      .execute();

    // Add ingredients and categories to test cascade deletion
    await db.insert(ingredientsTable)
      .values({
        recipe_id: recipe[0].id,
        name: 'Test Ingredient',
        quantity: '1 cup',
        unit: 'cup'
      })
      .execute();

    await db.insert(recipeCategoriesTable)
      .values({
        recipe_id: recipe[0].id,
        category: 'Breakfast'
      })
      .execute();

    // Delete the recipe
    const result = await deleteRecipe(recipe[0].id, user[0].id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify recipe was deleted from database
    const deletedRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipe[0].id))
      .execute();

    expect(deletedRecipe).toHaveLength(0);

    // Verify cascade deletion of ingredients
    const deletedIngredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, recipe[0].id))
      .execute();

    expect(deletedIngredients).toHaveLength(0);

    // Verify cascade deletion of categories
    const deletedCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, recipe[0].id))
      .execute();

    expect(deletedCategories).toHaveLength(0);
  });

  it('should throw error when recipe does not exist', async () => {
    const nonExistentRecipeId = 999;
    const userId = 1;

    await expect(deleteRecipe(nonExistentRecipeId, userId))
      .rejects.toThrow(/recipe not found/i);
  });

  it('should throw error when user is not the author', async () => {
    // Create two test users
    const author = await db.insert(usersTable)
      .values({
        username: 'author',
        email: 'author@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const otherUser = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create a recipe by the author
    const recipe = await db.insert(recipesTable)
      .values({
        title: 'Authors Recipe',
        description: 'A recipe by the author',
        instructions: 'Author instructions',
        author_id: author[0].id
      })
      .returning()
      .execute();

    // Try to delete the recipe as a different user
    await expect(deleteRecipe(recipe[0].id, otherUser[0].id))
      .rejects.toThrow(/unauthorized.*only.*author.*delete/i);

    // Verify recipe still exists
    const existingRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipe[0].id))
      .execute();

    expect(existingRecipe).toHaveLength(1);
  });

  it('should cascade delete user favorites when recipe is deleted', async () => {
    // Create users
    const author = await db.insert(usersTable)
      .values({
        username: 'author',
        email: 'author@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const favoriteUser = await db.insert(usersTable)
      .values({
        username: 'favoriteuser',
        email: 'favorite@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create a recipe
    const recipe = await db.insert(recipesTable)
      .values({
        title: 'Popular Recipe',
        description: 'A popular recipe',
        instructions: 'Popular instructions',
        author_id: author[0].id
      })
      .returning()
      .execute();

    // Add recipe to favorites
    await db.insert(userFavoritesTable)
      .values({
        user_id: favoriteUser[0].id,
        recipe_id: recipe[0].id
      })
      .execute();

    // Verify favorite exists before deletion
    const favoritesBefore = await db.select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.recipe_id, recipe[0].id))
      .execute();

    expect(favoritesBefore).toHaveLength(1);

    // Delete the recipe
    const result = await deleteRecipe(recipe[0].id, author[0].id);
    expect(result.success).toBe(true);

    // Verify favorite was cascade deleted
    const favoritesAfter = await db.select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.recipe_id, recipe[0].id))
      .execute();

    expect(favoritesAfter).toHaveLength(0);
  });

  it('should handle multiple related data deletions correctly', async () => {
    // Create a user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create a recipe
    const recipe = await db.insert(recipesTable)
      .values({
        title: 'Complex Recipe',
        description: 'A recipe with lots of related data',
        instructions: 'Complex instructions',
        author_id: user[0].id
      })
      .returning()
      .execute();

    // Add multiple ingredients
    await db.insert(ingredientsTable)
      .values([
        {
          recipe_id: recipe[0].id,
          name: 'Flour',
          quantity: '2 cups',
          unit: 'cup'
        },
        {
          recipe_id: recipe[0].id,
          name: 'Sugar',
          quantity: '1 cup',
          unit: 'cup'
        },
        {
          recipe_id: recipe[0].id,
          name: 'Salt',
          quantity: '1 tsp',
          unit: 'tsp'
        }
      ])
      .execute();

    // Add multiple categories
    await db.insert(recipeCategoriesTable)
      .values([
        {
          recipe_id: recipe[0].id,
          category: 'Breakfast'
        },
        {
          recipe_id: recipe[0].id,
          category: 'Dessert'
        }
      ])
      .execute();

    // Delete the recipe
    const result = await deleteRecipe(recipe[0].id, user[0].id);
    expect(result.success).toBe(true);

    // Verify all ingredients were deleted
    const remainingIngredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, recipe[0].id))
      .execute();

    expect(remainingIngredients).toHaveLength(0);

    // Verify all categories were deleted
    const remainingCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, recipe[0].id))
      .execute();

    expect(remainingCategories).toHaveLength(0);
  });
});
