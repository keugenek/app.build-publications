import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  recipesTable, 
  categoriesTable, 
  recipeCategoriesTable,
  favoriteRecipesTable 
} from '../db/schema';
import { type GetUserFavoritesInput } from '../schema';
import { getUserFavorites } from '../handlers/get_user_favorites';

// Test data setup helpers
const createTestUser = async (username: string = 'testuser', email: string = 'test@example.com') => {
  const result = await db.insert(usersTable)
    .values({ username, email })
    .returning()
    .execute();
  return result[0];
};

const createTestCategory = async (name: string = 'Test Category', description: string = 'Test description') => {
  const result = await db.insert(categoriesTable)
    .values({ name, description })
    .returning()
    .execute();
  return result[0];
};

const createTestRecipe = async (userId: number, title: string = 'Test Recipe') => {
  const result = await db.insert(recipesTable)
    .values({
      title,
      description: 'Test recipe description',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: ['step1', 'step2'],
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 4,
      user_id: userId
    })
    .returning()
    .execute();
  return result[0];
};

const addRecipeToCategory = async (recipeId: number, categoryId: number) => {
  await db.insert(recipeCategoriesTable)
    .values({ recipe_id: recipeId, category_id: categoryId })
    .execute();
};

const addFavoriteRecipe = async (userId: number, recipeId: number) => {
  const result = await db.insert(favoriteRecipesTable)
    .values({ user_id: userId, recipe_id: recipeId })
    .returning()
    .execute();
  return result[0];
};

// Test input with defaults applied
const testInput: GetUserFavoritesInput = {
  user_id: 1,
  limit: 20,
  offset: 0
};

describe('getUserFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no favorites', async () => {
    const user = await createTestUser();
    
    const result = await getUserFavorites({
      ...testInput,
      user_id: user.id
    });

    expect(result).toEqual([]);
  });

  it('should return user favorite recipes with full details', async () => {
    // Setup test data
    const user1 = await createTestUser('user1', 'user1@test.com');
    const user2 = await createTestUser('user2', 'user2@test.com');
    const category = await createTestCategory('Desserts', 'Sweet treats');
    
    const recipe1 = await createTestRecipe(user1.id, 'Chocolate Cake');
    const recipe2 = await createTestRecipe(user2.id, 'Vanilla Cookies');
    
    // Add categories to recipes
    await addRecipeToCategory(recipe1.id, category.id);
    await addRecipeToCategory(recipe2.id, category.id);
    
    // Add recipes to user1's favorites
    await addFavoriteRecipe(user1.id, recipe1.id);
    await addFavoriteRecipe(user1.id, recipe2.id);

    const result = await getUserFavorites({
      ...testInput,
      user_id: user1.id
    });

    expect(result).toHaveLength(2);
    
    // Check first recipe details
    const firstRecipe = result[0];
    expect(firstRecipe.id).toBeDefined();
    expect(firstRecipe.title).toEqual('Vanilla Cookies'); // Most recently favorited first
    expect(firstRecipe.description).toEqual('Test recipe description');
    expect(firstRecipe.ingredients).toEqual(['ingredient1', 'ingredient2']);
    expect(firstRecipe.instructions).toEqual(['step1', 'step2']);
    expect(firstRecipe.prep_time_minutes).toEqual(15);
    expect(firstRecipe.cook_time_minutes).toEqual(30);
    expect(firstRecipe.servings).toEqual(4);
    expect(firstRecipe.user_id).toEqual(user2.id);
    expect(firstRecipe.created_at).toBeInstanceOf(Date);
    expect(firstRecipe.updated_at).toBeInstanceOf(Date);
    expect(firstRecipe.is_favorite).toBe(true);
    
    // Check user details
    expect(firstRecipe.user.id).toEqual(user2.id);
    expect(firstRecipe.user.username).toEqual('user2');
    expect(firstRecipe.user.email).toEqual('user2@test.com');
    
    // Check categories
    expect(firstRecipe.categories).toHaveLength(1);
    expect(firstRecipe.categories[0].name).toEqual('Desserts');
    expect(firstRecipe.categories[0].description).toEqual('Sweet treats');
  });

  it('should return recipes ordered by favorite creation date (most recent first)', async () => {
    const user = await createTestUser();
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    const recipe1 = await createTestRecipe(recipeOwner.id, 'First Recipe');
    const recipe2 = await createTestRecipe(recipeOwner.id, 'Second Recipe');
    const recipe3 = await createTestRecipe(recipeOwner.id, 'Third Recipe');
    
    // Add to favorites in specific order
    await addFavoriteRecipe(user.id, recipe1.id);
    
    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await addFavoriteRecipe(user.id, recipe2.id);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    await addFavoriteRecipe(user.id, recipe3.id);

    const result = await getUserFavorites({
      ...testInput,
      user_id: user.id
    });

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Third Recipe');  // Most recent favorite
    expect(result[1].title).toEqual('Second Recipe');
    expect(result[2].title).toEqual('First Recipe');   // Oldest favorite
  });

  it('should handle pagination correctly', async () => {
    const user = await createTestUser();
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    // Create 5 recipes and add them to favorites
    const recipes = [];
    for (let i = 1; i <= 5; i++) {
      const recipe = await createTestRecipe(recipeOwner.id, `Recipe ${i}`);
      recipes.push(recipe);
      await addFavoriteRecipe(user.id, recipe.id);
    }

    // Test first page
    const page1 = await getUserFavorites({
      user_id: user.id,
      limit: 2,
      offset: 0
    });

    expect(page1).toHaveLength(2);
    expect(page1[0].title).toEqual('Recipe 5'); // Most recent
    expect(page1[1].title).toEqual('Recipe 4');

    // Test second page
    const page2 = await getUserFavorites({
      user_id: user.id,
      limit: 2,
      offset: 2
    });

    expect(page2).toHaveLength(2);
    expect(page2[0].title).toEqual('Recipe 3');
    expect(page2[1].title).toEqual('Recipe 2');

    // Test third page
    const page3 = await getUserFavorites({
      user_id: user.id,
      limit: 2,
      offset: 4
    });

    expect(page3).toHaveLength(1);
    expect(page3[0].title).toEqual('Recipe 1'); // Oldest
  });

  it('should handle recipes with multiple categories', async () => {
    const user = await createTestUser();
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    // Create multiple categories
    const category1 = await createTestCategory('Desserts', 'Sweet treats');
    const category2 = await createTestCategory('Quick Meals', 'Fast cooking');
    const category3 = await createTestCategory('Healthy', 'Nutritious options');
    
    const recipe = await createTestRecipe(recipeOwner.id, 'Multi-Category Recipe');
    
    // Add recipe to multiple categories
    await addRecipeToCategory(recipe.id, category1.id);
    await addRecipeToCategory(recipe.id, category2.id);
    await addRecipeToCategory(recipe.id, category3.id);
    
    await addFavoriteRecipe(user.id, recipe.id);

    const result = await getUserFavorites({
      ...testInput,
      user_id: user.id
    });

    expect(result).toHaveLength(1);
    expect(result[0].categories).toHaveLength(3);
    
    const categoryNames = result[0].categories.map(cat => cat.name).sort();
    expect(categoryNames).toEqual(['Desserts', 'Healthy', 'Quick Meals']);
  });

  it('should handle recipes with no categories', async () => {
    const user = await createTestUser();
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    const recipe = await createTestRecipe(recipeOwner.id, 'Uncategorized Recipe');
    await addFavoriteRecipe(user.id, recipe.id);

    const result = await getUserFavorites({
      ...testInput,
      user_id: user.id
    });

    expect(result).toHaveLength(1);
    expect(result[0].categories).toEqual([]);
    expect(result[0].title).toEqual('Uncategorized Recipe');
  });

  it('should only return favorites for the specified user', async () => {
    const user1 = await createTestUser('user1', 'user1@test.com');
    const user2 = await createTestUser('user2', 'user2@test.com');
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    const recipe1 = await createTestRecipe(recipeOwner.id, 'Recipe 1');
    const recipe2 = await createTestRecipe(recipeOwner.id, 'Recipe 2');
    const recipe3 = await createTestRecipe(recipeOwner.id, 'Recipe 3');
    
    // User1 favorites recipe1 and recipe2
    await addFavoriteRecipe(user1.id, recipe1.id);
    await addFavoriteRecipe(user1.id, recipe2.id);
    
    // User2 favorites recipe2 and recipe3
    await addFavoriteRecipe(user2.id, recipe2.id);
    await addFavoriteRecipe(user2.id, recipe3.id);

    const user1Favorites = await getUserFavorites({
      ...testInput,
      user_id: user1.id
    });

    const user2Favorites = await getUserFavorites({
      ...testInput,
      user_id: user2.id
    });

    expect(user1Favorites).toHaveLength(2);
    expect(user2Favorites).toHaveLength(2);
    
    const user1Titles = user1Favorites.map(r => r.title).sort();
    const user2Titles = user2Favorites.map(r => r.title).sort();
    
    expect(user1Titles).toEqual(['Recipe 1', 'Recipe 2']);
    expect(user2Titles).toEqual(['Recipe 2', 'Recipe 3']);
  });

  it('should handle recipes with nullable fields correctly', async () => {
    const user = await createTestUser();
    const recipeOwner = await createTestUser('owner', 'owner@test.com');
    
    // Create recipe with minimal data (nullable fields)
    const result = await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null,
        ingredients: ['basic ingredient'],
        instructions: ['basic step'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        user_id: recipeOwner.id
      })
      .returning()
      .execute();
    
    const recipe = result[0];
    await addFavoriteRecipe(user.id, recipe.id);

    const favorites = await getUserFavorites({
      ...testInput,
      user_id: user.id
    });

    expect(favorites).toHaveLength(1);
    expect(favorites[0].title).toEqual('Minimal Recipe');
    expect(favorites[0].description).toBeNull();
    expect(favorites[0].prep_time_minutes).toBeNull();
    expect(favorites[0].cook_time_minutes).toBeNull();
    expect(favorites[0].servings).toBeNull();
    expect(favorites[0].ingredients).toEqual(['basic ingredient']);
    expect(favorites[0].instructions).toEqual(['basic step']);
  });
});
