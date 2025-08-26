import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, categoriesTable, recipeCategoriesTable, favoriteRecipesTable } from '../db/schema';
import { getRecipe } from '../handlers/get_recipe';

describe('getRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent recipe', async () => {
    const result = await getRecipe(999);
    expect(result).toBeNull();
  });

  it('should get a basic recipe with user info', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testchef',
        email: 'chef@test.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: ['flour', 'eggs', 'milk'],
        instructions: ['mix ingredients', 'cook'],
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        user_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    const result = await getRecipe(recipeId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Test Recipe');
    expect(result!.description).toEqual('A delicious test recipe');
    expect(result!.ingredients).toEqual(['flour', 'eggs', 'milk']);
    expect(result!.instructions).toEqual(['mix ingredients', 'cook']);
    expect(result!.prep_time_minutes).toEqual(15);
    expect(result!.cook_time_minutes).toEqual(30);
    expect(result!.servings).toEqual(4);
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify user information
    expect(result!.user.id).toEqual(userId);
    expect(result!.user.username).toEqual('testchef');
    expect(result!.user.email).toEqual('chef@test.com');
    expect(result!.user.created_at).toBeInstanceOf(Date);

    // Categories should be empty array
    expect(result!.categories).toEqual([]);

    // is_favorite should be undefined when no viewing user
    expect(result!.is_favorite).toBeUndefined();
  });

  it('should get recipe with categories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testchef',
        email: 'chef@test.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test categories
    const categoryResult = await db.insert(categoriesTable)
      .values([
        { name: 'Breakfast', description: 'Morning meals' },
        { name: 'Quick', description: 'Fast to prepare' }
      ])
      .returning()
      .execute();

    const categoryIds = categoryResult.map(c => c.id);

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Quick Breakfast',
        description: 'Fast morning meal',
        ingredients: ['eggs', 'toast'],
        instructions: ['scramble eggs', 'toast bread'],
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        servings: 1,
        user_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Associate recipe with categories
    await db.insert(recipeCategoriesTable)
      .values([
        { recipe_id: recipeId, category_id: categoryIds[0] },
        { recipe_id: recipeId, category_id: categoryIds[1] }
      ])
      .execute();

    const result = await getRecipe(recipeId);

    expect(result).not.toBeNull();
    expect(result!.categories).toHaveLength(2);
    
    const categoryNames = result!.categories.map(c => c.name).sort();
    expect(categoryNames).toEqual(['Breakfast', 'Quick']);

    const category1 = result!.categories.find(c => c.name === 'Breakfast');
    expect(category1!.description).toEqual('Morning meals');
    expect(category1!.created_at).toBeInstanceOf(Date);

    const category2 = result!.categories.find(c => c.name === 'Quick');
    expect(category2!.description).toEqual('Fast to prepare');
  });

  it('should show favorite status when viewing user provided', async () => {
    // Create test users
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'chef1', email: 'chef1@test.com' },
        { username: 'chef2', email: 'chef2@test.com' }
      ])
      .returning()
      .execute();

    const recipeOwnerId = userResult[0].id;
    const viewingUserId = userResult[1].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Favorite Recipe',
        description: 'A recipe to be favorited',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        user_id: recipeOwnerId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Add to favorites
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: viewingUserId,
        recipe_id: recipeId
      })
      .execute();

    // Test with viewing user who has favorited
    const resultFavorited = await getRecipe(recipeId, viewingUserId);
    expect(resultFavorited!.is_favorite).toBe(true);

    // Test with viewing user who hasn't favorited (different user)
    const resultNotFavorited = await getRecipe(recipeId, recipeOwnerId);
    expect(resultNotFavorited!.is_favorite).toBe(false);
  });

  it('should handle recipe with null values', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'minimalist',
        email: 'minimal@test.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create minimal recipe with null values
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null, // Nullable field
        ingredients: ['water'],
        instructions: ['drink'],
        prep_time_minutes: null, // Nullable field
        cook_time_minutes: null, // Nullable field
        servings: null, // Nullable field
        user_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    const result = await getRecipe(recipeId);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Recipe');
    expect(result!.description).toBeNull();
    expect(result!.prep_time_minutes).toBeNull();
    expect(result!.cook_time_minutes).toBeNull();
    expect(result!.servings).toBeNull();
    expect(result!.ingredients).toEqual(['water']);
    expect(result!.instructions).toEqual(['drink']);
  });

  it('should handle complex recipe with all features', async () => {
    // Create test users
    const userResult = await db.insert(usersTable)
      .values([
        { username: 'masterchef', email: 'master@test.com' },
        { username: 'foodlover', email: 'lover@test.com' }
      ])
      .returning()
      .execute();

    const chefId = userResult[0].id;
    const loverId = userResult[1].id;

    // Create categories
    const categoryResult = await db.insert(categoriesTable)
      .values([
        { name: 'Dinner', description: 'Evening meals' },
        { name: 'Italian', description: 'Italian cuisine' },
        { name: 'Comfort Food', description: null }
      ])
      .returning()
      .execute();

    // Create complex recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Grandma\'s Lasagna',
        description: 'A hearty Italian lasagna passed down through generations',
        ingredients: [
          '1 lb ground beef',
          '1 jar marinara sauce',
          '12 lasagna noodles',
          '15 oz ricotta cheese',
          '2 cups mozzarella cheese',
          '1/2 cup parmesan cheese',
          '1 egg',
          'Italian herbs'
        ],
        instructions: [
          'Preheat oven to 375°F',
          'Cook lasagna noodles according to package directions',
          'Brown ground beef and add marinara sauce',
          'Mix ricotta cheese with egg and herbs',
          'Layer noodles, meat sauce, and cheese mixture',
          'Top with mozzarella and parmesan',
          'Bake for 45 minutes',
          'Let rest for 10 minutes before serving'
        ],
        prep_time_minutes: 30,
        cook_time_minutes: 45,
        servings: 8,
        user_id: chefId
      })
      .returning()
      .execute();

    const recipeId = recipeResult[0].id;

    // Associate with all categories
    await db.insert(recipeCategoriesTable)
      .values(categoryResult.map(cat => ({
        recipe_id: recipeId,
        category_id: cat.id
      })))
      .execute();

    // Add to favorites
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: loverId,
        recipe_id: recipeId
      })
      .execute();

    const result = await getRecipe(recipeId, loverId);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Grandma\'s Lasagna');
    expect(result!.description).toContain('Italian lasagna');
    expect(result!.ingredients).toHaveLength(8);
    expect(result!.instructions).toHaveLength(8);
    expect(result!.prep_time_minutes).toEqual(30);
    expect(result!.cook_time_minutes).toEqual(45);
    expect(result!.servings).toEqual(8);

    // Verify user
    expect(result!.user.username).toEqual('masterchef');
    expect(result!.user.email).toEqual('master@test.com');

    // Verify categories
    expect(result!.categories).toHaveLength(3);
    const categoryNames = result!.categories.map(c => c.name).sort();
    expect(categoryNames).toEqual(['Comfort Food', 'Dinner', 'Italian']);

    // Verify favorite status
    expect(result!.is_favorite).toBe(true);
  });
});
