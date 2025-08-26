import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
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
        { username: 'chef1', email: 'chef1@test.com' },
        { username: 'chef2', email: 'chef2@test.com' }
      ])
      .returning()
      .execute();

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Italian', description: 'Italian cuisine' },
        { name: 'Vegetarian', description: 'Plant-based recipes' },
        { name: 'Quick', description: 'Fast meals' }
      ])
      .returning()
      .execute();

    // Create test recipes
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'Classic Spaghetti Carbonara',
          description: 'Traditional Italian pasta dish with eggs and cheese',
          ingredients: JSON.stringify(['spaghetti', 'eggs', 'parmesan', 'bacon', 'black pepper']),
          instructions: JSON.stringify(['Boil pasta', 'Cook bacon', 'Mix eggs and cheese', 'Combine all']),
          prep_time_minutes: 15,
          cook_time_minutes: 20,
          servings: 4,
          user_id: users[0].id
        },
        {
          title: 'Quick Veggie Stir Fry',
          description: 'Fast and healthy vegetable stir fry',
          ingredients: JSON.stringify(['broccoli', 'carrots', 'bell peppers', 'soy sauce', 'garlic']),
          instructions: JSON.stringify(['Heat oil', 'Add vegetables', 'Stir fry', 'Season with soy sauce']),
          prep_time_minutes: 10,
          cook_time_minutes: 8,
          servings: 2,
          user_id: users[1].id
        },
        {
          title: 'Margherita Pizza',
          description: 'Classic Italian pizza with tomatoes, mozzarella and basil',
          ingredients: JSON.stringify(['pizza dough', 'tomato sauce', 'mozzarella', 'basil', 'olive oil']),
          instructions: JSON.stringify(['Roll dough', 'Spread sauce', 'Add cheese', 'Bake in oven']),
          prep_time_minutes: 20,
          cook_time_minutes: 15,
          servings: 3,
          user_id: users[0].id
        }
      ])
      .returning()
      .execute();

    // Create recipe-category associations
    await db.insert(recipeCategoriesTable)
      .values([
        { recipe_id: recipes[0].id, category_id: categories[0].id }, // Carbonara -> Italian
        { recipe_id: recipes[1].id, category_id: categories[1].id }, // Stir Fry -> Vegetarian
        { recipe_id: recipes[1].id, category_id: categories[2].id }, // Stir Fry -> Quick
        { recipe_id: recipes[2].id, category_id: categories[0].id }  // Pizza -> Italian
      ])
      .execute();

    return { users, categories, recipes };
  };

  it('should return all recipes with default pagination', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    
    // Verify structure of first result
    const firstResult = results[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.title).toBeDefined();
    expect(firstResult.user).toBeDefined();
    expect(firstResult.user.username).toBeDefined();
    expect(firstResult.categories).toBeDefined();
    expect(Array.isArray(firstResult.ingredients)).toBe(true);
    expect(Array.isArray(firstResult.instructions)).toBe(true);
  });

  it('should search recipes by title text', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      query: 'spaghetti',
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Classic Spaghetti Carbonara');
  });

  it('should search recipes by description text', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      query: 'healthy',
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Quick Veggie Stir Fry');
  });

  it('should search recipes by ingredients', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      query: 'mozzarella',
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Margherita Pizza');
  });

  it('should filter recipes by user_id', async () => {
    const { users } = await setupTestData();

    const input: SearchRecipesInput = {
      user_id: users[1].id,
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Quick Veggie Stir Fry');
    expect(results[0].user.username).toBe('chef2');
  });

  it('should filter recipes by single category', async () => {
    const { categories } = await setupTestData();

    const input: SearchRecipesInput = {
      category_ids: [categories[0].id], // Italian category
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    
    const titles = results.map(r => r.title);
    expect(titles).toContain('Classic Spaghetti Carbonara');
    expect(titles).toContain('Margherita Pizza');
  });

  it('should filter recipes by multiple categories', async () => {
    const { categories } = await setupTestData();

    const input: SearchRecipesInput = {
      category_ids: [categories[1].id, categories[2].id], // Vegetarian and Quick
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Quick Veggie Stir Fry');
  });

  it('should combine text search and category filter', async () => {
    const { categories } = await setupTestData();

    const input: SearchRecipesInput = {
      query: 'Italian',
      category_ids: [categories[0].id], // Italian category
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2); // Both Italian recipes contain "Italian" in description
  });

  it('should return recipes with proper category associations', async () => {
    const { categories } = await setupTestData();

    const input: SearchRecipesInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    // Find the stir fry recipe (should have 2 categories)
    const stirFry = results.find(r => r.title === 'Quick Veggie Stir Fry');
    expect(stirFry).toBeDefined();
    expect(stirFry!.categories).toHaveLength(2);
    
    const categoryNames = stirFry!.categories.map(c => c.name);
    expect(categoryNames).toContain('Vegetarian');
    expect(categoryNames).toContain('Quick');
  });

  it('should handle pagination correctly', async () => {
    await setupTestData();

    // Get first page
    const firstPage = await searchRecipes({
      limit: 2,
      offset: 0
    });

    // Get second page
    const secondPage = await searchRecipes({
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
    
    // Ensure no duplicates between pages
    const firstPageIds = firstPage.map(r => r.id);
    const secondPageIds = secondPage.map(r => r.id);
    expect(firstPageIds).not.toContain(secondPageIds[0]);
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      query: 'nonexistent recipe',
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(0);
  });

  it('should order results by created_at descending', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    
    // Results should be ordered by created_at desc (newest first)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }
  });

  it('should handle empty search input correctly', async () => {
    await setupTestData();

    const input: SearchRecipesInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.user && r.categories !== undefined)).toBe(true);
  });

  it('should return recipes without categories when none assigned', async () => {
    // Create a recipe without categories
    const user = await db.insert(usersTable)
      .values({ username: 'testuser', email: 'test@test.com' })
      .returning()
      .execute();

    await db.insert(recipesTable)
      .values({
        title: 'Simple Recipe',
        description: 'A recipe without categories',
        ingredients: JSON.stringify(['ingredient1']),
        instructions: JSON.stringify(['step1']),
        user_id: user[0].id
      })
      .execute();

    const input: SearchRecipesInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].categories).toHaveLength(0);
  });
});
