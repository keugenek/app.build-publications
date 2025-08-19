import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { type SearchRecipesInput } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';

// Test data setup
const testUser = {
  username: 'testchef',
  email: 'chef@example.com'
};

const testRecipe1 = {
  title: 'Spaghetti Carbonara',
  description: 'Classic Italian pasta dish with eggs and cheese',
  ingredients: ['spaghetti', 'eggs', 'parmesan cheese', 'pancetta', 'black pepper'],
  instructions: ['Boil pasta', 'Cook pancetta', 'Mix eggs and cheese', 'Combine everything'],
  categories: ['dinner', 'main_course', 'international'],
  prep_time_minutes: 15,
  cook_time_minutes: 20,
  servings: 4,
  difficulty: 'medium' as const,
  author_id: 1
};

const testRecipe2 = {
  title: 'Chocolate Chip Cookies',
  description: 'Sweet and chewy homemade cookies',
  ingredients: ['flour', 'sugar', 'butter', 'chocolate chips', 'eggs'],
  instructions: ['Mix dry ingredients', 'Cream butter and sugar', 'Add eggs', 'Fold in chips', 'Bake'],
  categories: ['dessert', 'snack'],
  prep_time_minutes: 10,
  cook_time_minutes: 12,
  servings: 24,
  difficulty: 'easy' as const,
  author_id: 1
};

const testRecipe3 = {
  title: 'Green Salad',
  description: 'Fresh vegetarian salad with mixed greens',
  ingredients: ['lettuce', 'tomatoes', 'cucumbers', 'olive oil', 'vinegar'],
  instructions: ['Wash greens', 'Chop vegetables', 'Make dressing', 'Toss together'],
  categories: ['salad', 'vegetarian', 'healthy'],
  prep_time_minutes: 5,
  cook_time_minutes: null,
  servings: 2,
  difficulty: 'easy' as const,
  author_id: 1
};

describe('searchRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test recipes
    await db.insert(recipesTable).values([
      testRecipe1,
      testRecipe2,
      testRecipe3
    ]).execute();
  });

  it('should return all recipes when no filters provided', async () => {
    const input: SearchRecipesInput = {};
    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    expect(results.map(r => r.title)).toContain('Spaghetti Carbonara');
    expect(results.map(r => r.title)).toContain('Chocolate Chip Cookies');
    expect(results.map(r => r.title)).toContain('Green Salad');
  });

  it('should search by query in title', async () => {
    const input: SearchRecipesInput = {
      query: 'chocolate'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Chip Cookies');
  });

  it('should search by query in description', async () => {
    const input: SearchRecipesInput = {
      query: 'Italian'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Spaghetti Carbonara');
  });

  it('should filter by single category', async () => {
    const input: SearchRecipesInput = {
      categories: ['dessert']
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Chip Cookies');
    expect(results[0].categories).toContain('dessert');
  });

  it('should filter by multiple categories', async () => {
    const input: SearchRecipesInput = {
      categories: ['vegetarian', 'international']
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Green Salad');
    expect(titles).toContain('Spaghetti Carbonara');
  });

  it('should filter by difficulty', async () => {
    const input: SearchRecipesInput = {
      difficulty: 'easy'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    results.forEach(recipe => {
      expect(recipe.difficulty).toEqual('easy');
    });
  });

  it('should filter by max prep time', async () => {
    const input: SearchRecipesInput = {
      max_prep_time: 10
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    results.forEach(recipe => {
      expect(recipe.prep_time_minutes).toBeLessThanOrEqual(10);
    });
  });

  it('should filter by max cook time', async () => {
    const input: SearchRecipesInput = {
      max_cook_time: 15
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Chip Cookies');
    expect(results[0].cook_time_minutes).toBeLessThanOrEqual(15);
  });

  it('should filter by author_id', async () => {
    // Create second user and recipe
    const secondUser = await db.insert(usersTable).values({
      username: 'baker',
      email: 'baker@example.com'
    }).returning().execute();

    const secondUserId = secondUser[0].id;

    await db.insert(recipesTable).values({
      title: 'Bread Recipe',
      description: 'Simple homemade bread',
      ingredients: ['flour', 'water', 'yeast', 'salt'],
      instructions: ['Mix ingredients', 'Knead dough', 'Let rise', 'Bake'],
      categories: ['breakfast'],
      prep_time_minutes: 30,
      cook_time_minutes: 45,
      servings: 8,
      difficulty: 'medium' as const,
      author_id: secondUserId
    }).execute();

    const input: SearchRecipesInput = {
      author_id: secondUserId
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Bread Recipe');
    expect(results[0].author_id).toEqual(secondUserId);
  });

  it('should combine multiple filters', async () => {
    const input: SearchRecipesInput = {
      difficulty: 'easy',
      categories: ['dessert']
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Chip Cookies');
    expect(results[0].difficulty).toEqual('easy');
    expect(results[0].categories).toContain('dessert');
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchRecipesInput = {
      query: 'nonexistentdish'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(0);
  });

  it('should handle case-insensitive search', async () => {
    const input: SearchRecipesInput = {
      query: 'CHOCOLATE'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Chip Cookies');
  });

  it('should return correct recipe structure', async () => {
    const input: SearchRecipesInput = {
      query: 'carbonara'
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    const recipe = results[0];

    expect(recipe.id).toBeDefined();
    expect(recipe.title).toEqual('Spaghetti Carbonara');
    expect(recipe.description).toEqual('Classic Italian pasta dish with eggs and cheese');
    expect(Array.isArray(recipe.ingredients)).toBe(true);
    expect(Array.isArray(recipe.instructions)).toBe(true);
    expect(Array.isArray(recipe.categories)).toBe(true);
    expect(recipe.prep_time_minutes).toEqual(15);
    expect(recipe.cook_time_minutes).toEqual(20);
    expect(recipe.servings).toEqual(4);
    expect(recipe.difficulty).toEqual('medium');
    expect(recipe.author_id).toEqual(1);
    expect(recipe.created_at).toBeInstanceOf(Date);
    expect(recipe.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const input: SearchRecipesInput = {
      categories: ['salad']
    };
    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    const recipe = results[0];
    expect(recipe.title).toEqual('Green Salad');
    expect(recipe.cook_time_minutes).toBeNull();
  });
});
