import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { getRecipe } from '../handlers/get_recipe';
import { eq } from 'drizzle-orm';

describe('getRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a recipe with all details', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testchef',
        email: 'chef@test.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        instructions: 'Mix ingredients and cook for 30 minutes',
        author_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Add ingredients
    await db.insert(ingredientsTable)
      .values([
        {
          recipe_id: recipeId,
          name: 'Flour',
          quantity: '2',
          unit: 'cups'
        },
        {
          recipe_id: recipeId,
          name: 'Sugar',
          quantity: '1',
          unit: 'cup'
        },
        {
          recipe_id: recipeId,
          name: 'Salt',
          quantity: '1',
          unit: 'tsp'
        }
      ])
      .execute();

    // Add categories
    await db.insert(recipeCategoriesTable)
      .values([
        {
          recipe_id: recipeId,
          category: 'Breakfast'
        },
        {
          recipe_id: recipeId,
          category: 'Vegetarian'
        }
      ])
      .execute();

    // Test the handler
    const result = await getRecipe(recipeId);

    // Verify basic recipe details
    expect(result.id).toEqual(recipeId);
    expect(result.title).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.instructions).toEqual('Mix ingredients and cook for 30 minutes');
    expect(result.author_id).toEqual(userId);
    expect(result.author_username).toEqual('testchef');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify ingredients
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Flour',
          quantity: '2',
          unit: 'cups',
          recipe_id: recipeId
        }),
        expect.objectContaining({
          name: 'Sugar',
          quantity: '1',
          unit: 'cup',
          recipe_id: recipeId
        }),
        expect.objectContaining({
          name: 'Salt',
          quantity: '1',
          unit: 'tsp',
          recipe_id: recipeId
        })
      ])
    );

    // Verify categories
    expect(result.categories).toHaveLength(2);
    expect(result.categories).toEqual(
      expect.arrayContaining(['Breakfast', 'Vegetarian'])
    );
  });

  it('should handle recipe with no ingredients or categories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'minimalist',
        email: 'minimal@test.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create recipe without ingredients or categories
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Simple Recipe',
        description: 'A very simple recipe',
        instructions: 'Just cook it',
        author_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    const result = await getRecipe(recipeId);

    expect(result.id).toEqual(recipeId);
    expect(result.title).toEqual('Simple Recipe');
    expect(result.author_username).toEqual('minimalist');
    expect(result.ingredients).toHaveLength(0);
    expect(result.categories).toHaveLength(0);
  });

  it('should handle ingredients with null units', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'unitless',
        email: 'unitless@test.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Unitless Recipe',
        description: 'Recipe with unitless ingredients',
        instructions: 'Add ingredients without specific units',
        author_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Add ingredient with null unit
    await db.insert(ingredientsTable)
      .values({
        recipe_id: recipeId,
        name: 'Whole Chicken',
        quantity: '1',
        unit: null
      })
      .execute();

    const result = await getRecipe(recipeId);

    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].name).toEqual('Whole Chicken');
    expect(result.ingredients[0].quantity).toEqual('1');
    expect(result.ingredients[0].unit).toBeNull();
  });

  it('should throw error when recipe not found', async () => {
    const nonExistentId = 99999;

    await expect(getRecipe(nonExistentId))
      .rejects
      .toThrow(/Recipe with id 99999 not found/i);
  });

  it('should verify recipe exists in database after retrieval', async () => {
    // Create test user and recipe
    const userResult = await db.insert(usersTable)
      .values({
        username: 'verifyuser',
        email: 'verify@test.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Verification Recipe',
        description: 'Recipe for verification',
        instructions: 'Follow verification steps',
        author_id: userResult[0].id
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Get recipe through handler
    const result = await getRecipe(recipeId);

    // Verify the recipe still exists in database
    const dbRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(dbRecipe).toHaveLength(1);
    expect(dbRecipe[0].title).toEqual(result.title);
    expect(dbRecipe[0].description).toEqual(result.description);
    expect(dbRecipe[0].instructions).toEqual(result.instructions);
    expect(dbRecipe[0].author_id).toEqual(result.author_id);
    expect(dbRecipe[0].created_at).toBeInstanceOf(Date);
    expect(dbRecipe[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple categories correctly', async () => {
    // Create user and recipe
    const userResult = await db.insert(usersTable)
      .values({
        username: 'multicategory',
        email: 'multi@test.com',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Multi-Category Recipe',
        description: 'Recipe with many categories',
        instructions: 'Cook with love',
        author_id: userResult[0].id
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Add multiple categories
    await db.insert(recipeCategoriesTable)
      .values([
        { recipe_id: recipeId, category: 'Breakfast' },
        { recipe_id: recipeId, category: 'Lunch' },
        { recipe_id: recipeId, category: 'Vegetarian' },
        { recipe_id: recipeId, category: 'Gluten-Free' }
      ])
      .execute();

    const result = await getRecipe(recipeId);

    expect(result.categories).toHaveLength(4);
    expect(result.categories).toEqual(
      expect.arrayContaining(['Breakfast', 'Lunch', 'Vegetarian', 'Gluten-Free'])
    );
  });
});
