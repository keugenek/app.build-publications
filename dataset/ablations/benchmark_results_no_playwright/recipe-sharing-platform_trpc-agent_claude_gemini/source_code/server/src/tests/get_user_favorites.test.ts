import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable, userFavoritesTable } from '../db/schema';
import { type GetUserFavoritesInput } from '../schema';
import { getUserFavorites } from '../handlers/get_user_favorites';

describe('getUserFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async (username: string, email: string) => {
    const result = await db.insert(usersTable)
      .values({
        username,
        email,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestRecipe = async (title: string, author_id: number) => {
    const result = await db.insert(recipesTable)
      .values({
        title,
        description: `Description for ${title}`,
        instructions: `Instructions for ${title}`,
        author_id
      })
      .returning()
      .execute();
    return result[0];
  };

  const addIngredients = async (recipe_id: number, ingredients: Array<{name: string, quantity: string, unit: string | null}>) => {
    for (const ingredient of ingredients) {
      await db.insert(ingredientsTable)
        .values({
          recipe_id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        })
        .execute();
    }
  };

  const addCategories = async (recipe_id: number, categories: string[]) => {
    for (const category of categories) {
      await db.insert(recipeCategoriesTable)
        .values({
          recipe_id,
          category: category as any
        })
        .execute();
    }
  };

  const addToFavorites = async (user_id: number, recipe_id: number) => {
    await db.insert(userFavoritesTable)
      .values({
        user_id,
        recipe_id
      })
      .execute();
  };

  it('should return empty array for user with no favorites', async () => {
    const user = await createTestUser('testuser', 'test@example.com');
    
    const input: GetUserFavoritesInput = {
      user_id: user.id
    };

    const result = await getUserFavorites(input);

    expect(result).toEqual([]);
  });

  it('should return favorite recipes with complete details', async () => {
    // Create test users
    const user1 = await createTestUser('user1', 'user1@example.com');
    const chef = await createTestUser('chef', 'chef@example.com');

    // Create test recipe
    const recipe = await createTestRecipe('Spaghetti Carbonara', chef.id);

    // Add ingredients
    await addIngredients(recipe.id, [
      { name: 'Spaghetti', quantity: '400', unit: 'g' },
      { name: 'Eggs', quantity: '3', unit: null }
    ]);

    // Add categories
    await addCategories(recipe.id, ['Dinner', 'Main Course']);

    // Add to favorites
    await addToFavorites(user1.id, recipe.id);

    const input: GetUserFavoritesInput = {
      user_id: user1.id
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    
    const favoriteRecipe = result[0];
    expect(favoriteRecipe.id).toEqual(recipe.id);
    expect(favoriteRecipe.title).toEqual('Spaghetti Carbonara');
    expect(favoriteRecipe.description).toEqual('Description for Spaghetti Carbonara');
    expect(favoriteRecipe.instructions).toEqual('Instructions for Spaghetti Carbonara');
    expect(favoriteRecipe.author_id).toEqual(chef.id);
    expect(favoriteRecipe.author_username).toEqual('chef');
    expect(favoriteRecipe.created_at).toBeInstanceOf(Date);
    expect(favoriteRecipe.updated_at).toBeInstanceOf(Date);

    // Check ingredients
    expect(favoriteRecipe.ingredients).toHaveLength(2);
    expect(favoriteRecipe.ingredients[0].name).toEqual('Spaghetti');
    expect(favoriteRecipe.ingredients[0].quantity).toEqual('400');
    expect(favoriteRecipe.ingredients[0].unit).toEqual('g');
    expect(favoriteRecipe.ingredients[1].name).toEqual('Eggs');
    expect(favoriteRecipe.ingredients[1].quantity).toEqual('3');
    expect(favoriteRecipe.ingredients[1].unit).toBeNull();

    // Check categories
    expect(favoriteRecipe.categories).toHaveLength(2);
    expect(favoriteRecipe.categories).toContain('Dinner');
    expect(favoriteRecipe.categories).toContain('Main Course');
  });

  it('should return multiple favorite recipes ordered by most recently favorited', async () => {
    // Create test users
    const user1 = await createTestUser('user1', 'user1@example.com');
    const chef = await createTestUser('chef', 'chef@example.com');

    // Create test recipes
    const recipe1 = await createTestRecipe('First Recipe', chef.id);
    const recipe2 = await createTestRecipe('Second Recipe', chef.id);
    const recipe3 = await createTestRecipe('Third Recipe', chef.id);

    // Add basic ingredients and categories for all recipes
    await addIngredients(recipe1.id, [{ name: 'Ingredient 1', quantity: '1', unit: 'cup' }]);
    await addCategories(recipe1.id, ['Breakfast']);

    await addIngredients(recipe2.id, [{ name: 'Ingredient 2', quantity: '2', unit: 'tbsp' }]);
    await addCategories(recipe2.id, ['Lunch']);

    await addIngredients(recipe3.id, [{ name: 'Ingredient 3', quantity: '3', unit: 'oz' }]);
    await addCategories(recipe3.id, ['Dinner']);

    // Add to favorites in specific order (recipe1 first, then recipe2, then recipe3)
    await addToFavorites(user1.id, recipe1.id);
    
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await addToFavorites(user1.id, recipe2.id);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    await addToFavorites(user1.id, recipe3.id);

    const input: GetUserFavoritesInput = {
      user_id: user1.id
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by most recently favorited first (recipe3, recipe2, recipe1)
    expect(result[0].title).toEqual('Third Recipe');
    expect(result[1].title).toEqual('Second Recipe');
    expect(result[2].title).toEqual('First Recipe');
  });

  it('should only return favorites for the specified user', async () => {
    // Create test users
    const user1 = await createTestUser('user1', 'user1@example.com');
    const user2 = await createTestUser('user2', 'user2@example.com');
    const chef = await createTestUser('chef', 'chef@example.com');

    // Create test recipes
    const recipe1 = await createTestRecipe('Recipe 1', chef.id);
    const recipe2 = await createTestRecipe('Recipe 2', chef.id);

    // Add basic ingredients and categories
    await addIngredients(recipe1.id, [{ name: 'Ingredient 1', quantity: '1', unit: 'cup' }]);
    await addCategories(recipe1.id, ['Breakfast']);

    await addIngredients(recipe2.id, [{ name: 'Ingredient 2', quantity: '2', unit: 'tbsp' }]);
    await addCategories(recipe2.id, ['Lunch']);

    // User1 favorites recipe1, User2 favorites recipe2
    await addToFavorites(user1.id, recipe1.id);
    await addToFavorites(user2.id, recipe2.id);

    const input: GetUserFavoritesInput = {
      user_id: user1.id
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Recipe 1');
  });

  it('should handle recipes with no ingredients or categories', async () => {
    // Create test users
    const user1 = await createTestUser('user1', 'user1@example.com');
    const chef = await createTestUser('chef', 'chef@example.com');

    // Create test recipe without ingredients or categories
    const recipe = await createTestRecipe('Simple Recipe', chef.id);

    // Add to favorites
    await addToFavorites(user1.id, recipe.id);

    const input: GetUserFavoritesInput = {
      user_id: user1.id
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    
    const favoriteRecipe = result[0];
    expect(favoriteRecipe.title).toEqual('Simple Recipe');
    expect(favoriteRecipe.ingredients).toEqual([]);
    expect(favoriteRecipe.categories).toEqual([]);
  });

  it('should handle non-existent user gracefully', async () => {
    const input: GetUserFavoritesInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getUserFavorites(input);

    expect(result).toEqual([]);
  });
});
