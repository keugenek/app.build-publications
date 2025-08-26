import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { type SearchRecipesInput } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';

describe('searchRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const setupTestData = async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          password_hash: 'hash1',
          name: 'Chef One'
        },
        {
          email: 'user2@test.com',
          password_hash: 'hash2',
          name: 'Chef Two'
        }
      ])
      .returning()
      .execute();

    // Create test recipes
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'Pasta Carbonara',
          description: 'Classic Italian pasta dish',
          ingredients: ['pasta', 'eggs', 'bacon', 'cheese'],
          instructions: ['Cook pasta', 'Mix eggs and cheese', 'Combine with bacon'],
          prep_time_minutes: 15,
          cook_time_minutes: 20,
          servings: 4,
          category: 'main_course',
          user_id: users[0].id
        },
        {
          title: 'Chocolate Cake',
          description: 'Rich chocolate dessert',
          ingredients: ['flour', 'cocoa', 'eggs', 'sugar', 'butter'],
          instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake'],
          prep_time_minutes: 30,
          cook_time_minutes: 45,
          servings: 8,
          category: 'dessert',
          user_id: users[1].id
        },
        {
          title: 'Caesar Salad',
          description: 'Fresh salad with croutons',
          ingredients: ['lettuce', 'croutons', 'parmesan', 'caesar dressing'],
          instructions: ['Wash lettuce', 'Add toppings', 'Dress salad'],
          prep_time_minutes: 10,
          cook_time_minutes: null,
          servings: 2,
          category: 'salad',
          user_id: users[0].id
        },
        {
          title: 'Vegetarian Pasta',
          description: 'Healthy pasta with vegetables',
          ingredients: ['pasta', 'tomatoes', 'zucchini', 'herbs'],
          instructions: ['Cook pasta', 'Sauté vegetables', 'Mix together'],
          prep_time_minutes: 20,
          cook_time_minutes: 25,
          servings: 3,
          category: 'vegetarian',
          user_id: users[1].id
        }
      ])
      .returning()
      .execute();

    // Create some favorite relationships
    await db.insert(favoriteRecipesTable)
      .values([
        {
          user_id: users[0].id,
          recipe_id: recipes[1].id // Chef One likes Chocolate Cake
        },
        {
          user_id: users[1].id,
          recipe_id: recipes[0].id // Chef Two likes Pasta Carbonara
        }
      ])
      .execute();

    return { users, recipes };
  };

  it('should return all recipes when no filters provided', async () => {
    const { recipes } = await setupTestData();
    const input: SearchRecipesInput = {};

    const results = await searchRecipes(input);

    expect(results).toHaveLength(4);
    expect(results[0].user_name).toBeDefined();
    expect(results[0].is_favorite).toBeUndefined(); // No currentUserId provided
    
    // Results should be ordered by creation date (newest first)
    const titles = results.map(r => r.title);
    expect(titles).toContain('Pasta Carbonara');
    expect(titles).toContain('Chocolate Cake');
    expect(titles).toContain('Caesar Salad');
    expect(titles).toContain('Vegetarian Pasta');
  });

  it('should search by title query case-insensitively', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      query: 'pasta'
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Pasta Carbonara');
    expect(titles).toContain('Vegetarian Pasta');
  });

  it('should filter by single ingredient', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      ingredients: ['eggs']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Pasta Carbonara');
    expect(titles).toContain('Chocolate Cake');
  });

  it('should filter by multiple ingredients (OR condition)', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      ingredients: ['lettuce', 'cocoa']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Caesar Salad');
    expect(titles).toContain('Chocolate Cake');
  });

  it('should filter by categories', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      categories: ['dessert', 'salad']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Chocolate Cake');
    expect(titles).toContain('Caesar Salad');
  });

  it('should filter by user_id', async () => {
    const { users } = await setupTestData();
    const input: SearchRecipesInput = {
      user_id: users[0].id
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    results.forEach(recipe => {
      expect(recipe.user_id).toBe(users[0].id);
      expect(recipe.user_name).toBe('Chef One');
    });
  });

  it('should combine multiple filters (AND condition)', async () => {
    const { users } = await setupTestData();
    const input: SearchRecipesInput = {
      query: 'pasta',
      user_id: users[0].id,
      categories: ['main_course']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Pasta Carbonara');
    expect(results[0].user_name).toBe('Chef One');
    expect(results[0].category).toBe('main_course');
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      query: 'nonexistent recipe',
      categories: ['beverage']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(0);
  });

  it('should include favorite status when currentUserId provided', async () => {
    const { users } = await setupTestData();
    const input: SearchRecipesInput = {};

    const results = await searchRecipes(input, users[0].id);

    expect(results).toHaveLength(4);
    
    // Check that all results have is_favorite defined
    results.forEach(recipe => {
      expect(recipe.is_favorite).toBeDefined();
      expect(typeof recipe.is_favorite).toBe('boolean');
    });

    // Find the chocolate cake (should be favorite for users[0])
    const chocolateCake = results.find(r => r.title === 'Chocolate Cake');
    expect(chocolateCake?.is_favorite).toBe(true);

    // Find pasta carbonara (should not be favorite for users[0])
    const pastaCarbonara = results.find(r => r.title === 'Pasta Carbonara');
    expect(pastaCarbonara?.is_favorite).toBe(false);
  });

  it('should handle complex search with favorites', async () => {
    const { users } = await setupTestData();
    const input: SearchRecipesInput = {
      ingredients: ['pasta'],
      categories: ['main_course', 'vegetarian']
    };

    const results = await searchRecipes(input, users[1].id);

    expect(results).toHaveLength(2);
    
    // Both should have is_favorite defined
    results.forEach(recipe => {
      expect(recipe.is_favorite).toBeDefined();
    });

    // Find pasta carbonara (should be favorite for users[1])
    const pastaCarbonara = results.find(r => r.title === 'Pasta Carbonara');
    expect(pastaCarbonara?.is_favorite).toBe(true);

    // Find vegetarian pasta (should not be favorite for users[1])
    const vegetarianPasta = results.find(r => r.title === 'Vegetarian Pasta');
    expect(vegetarianPasta?.is_favorite).toBe(false);
  });

  it('should return proper recipe structure with all fields', async () => {
    await setupTestData();
    const input: SearchRecipesInput = {
      query: 'Carbonara'
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    const recipe = results[0];

    // Verify all required fields are present
    expect(recipe.id).toBeDefined();
    expect(recipe.title).toBe('Pasta Carbonara');
    expect(recipe.description).toBe('Classic Italian pasta dish');
    expect(Array.isArray(recipe.ingredients)).toBe(true);
    expect(recipe.ingredients).toContain('pasta');
    expect(Array.isArray(recipe.instructions)).toBe(true);
    expect(recipe.instructions).toContain('Cook pasta');
    expect(recipe.prep_time_minutes).toBe(15);
    expect(recipe.cook_time_minutes).toBe(20);
    expect(recipe.servings).toBe(4);
    expect(recipe.category).toBe('main_course');
    expect(recipe.user_id).toBeDefined();
    expect(recipe.created_at).toBeInstanceOf(Date);
    expect(recipe.updated_at).toBeInstanceOf(Date);
    expect(recipe.user_name).toBe('Chef One');
    expect(recipe.is_favorite).toBeUndefined(); // No currentUserId provided
  });
});
