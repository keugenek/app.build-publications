import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { type SearchRecipesInput } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';

describe('searchRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'chef_alice',
          email: 'alice@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'chef_bob',
          email: 'bob@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create test recipes
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'Chocolate Cake',
          description: 'Delicious chocolate dessert cake',
          instructions: 'Mix ingredients and bake',
          author_id: users[0].id
        },
        {
          title: 'Pasta Carbonara',
          description: 'Italian pasta with eggs and cheese',
          instructions: 'Cook pasta, mix with sauce',
          author_id: users[0].id
        },
        {
          title: 'Vegetarian Pizza',
          description: 'Pizza with vegetables and cheese',
          instructions: 'Make dough, add toppings, bake',
          author_id: users[1].id
        },
        {
          title: 'Chicken Stir Fry',
          description: 'Quick chicken and vegetable dish',
          instructions: 'Stir fry chicken with vegetables',
          author_id: users[1].id
        }
      ])
      .returning()
      .execute();

    // Create test ingredients
    await db.insert(ingredientsTable)
      .values([
        // Chocolate Cake ingredients
        { recipe_id: recipes[0].id, name: 'chocolate', quantity: '200', unit: 'g' },
        { recipe_id: recipes[0].id, name: 'flour', quantity: '300', unit: 'g' },
        { recipe_id: recipes[0].id, name: 'eggs', quantity: '3', unit: 'pieces' },
        
        // Pasta Carbonara ingredients
        { recipe_id: recipes[1].id, name: 'pasta', quantity: '400', unit: 'g' },
        { recipe_id: recipes[1].id, name: 'eggs', quantity: '2', unit: 'pieces' },
        { recipe_id: recipes[1].id, name: 'cheese', quantity: '100', unit: 'g' },
        
        // Vegetarian Pizza ingredients
        { recipe_id: recipes[2].id, name: 'dough', quantity: '1', unit: 'piece' },
        { recipe_id: recipes[2].id, name: 'tomatoes', quantity: '3', unit: 'pieces' },
        { recipe_id: recipes[2].id, name: 'cheese', quantity: '150', unit: 'g' },
        
        // Chicken Stir Fry ingredients
        { recipe_id: recipes[3].id, name: 'chicken', quantity: '500', unit: 'g' },
        { recipe_id: recipes[3].id, name: 'vegetables', quantity: '300', unit: 'g' }
      ])
      .execute();

    // Create test categories
    await db.insert(recipeCategoriesTable)
      .values([
        { recipe_id: recipes[0].id, category: 'Dessert' },
        { recipe_id: recipes[1].id, category: 'Main Course' },
        { recipe_id: recipes[1].id, category: 'Lunch' },
        { recipe_id: recipes[2].id, category: 'Vegetarian' },
        { recipe_id: recipes[2].id, category: 'Dinner' },
        { recipe_id: recipes[3].id, category: 'Main Course' },
        { recipe_id: recipes[3].id, category: 'Dinner' }
      ])
      .execute();

    return { users, recipes };
  };

  it('should return all recipes when no filters are provided', async () => {
    const { recipes } = await createTestData();
    const input: SearchRecipesInput = {};

    const results = await searchRecipes(input);

    expect(results).toHaveLength(4);
    expect(results.map(r => r.title).sort()).toEqual([
      'Chicken Stir Fry',
      'Chocolate Cake', 
      'Pasta Carbonara',
      'Vegetarian Pizza'
    ]);
    
    // Verify structure includes all required fields
    const firstResult = results[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.title).toBeDefined();
    expect(firstResult.description).toBeDefined();
    expect(firstResult.instructions).toBeDefined();
    expect(firstResult.author_id).toBeDefined();
    expect(firstResult.author_username).toBeDefined();
    expect(firstResult.created_at).toBeInstanceOf(Date);
    expect(firstResult.updated_at).toBeInstanceOf(Date);
    expect(Array.isArray(firstResult.ingredients)).toBe(true);
    expect(Array.isArray(firstResult.categories)).toBe(true);
  });

  it('should filter recipes by text query in title', async () => {
    await createTestData();
    const input: SearchRecipesInput = { query: 'chocolate' };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Cake');
    expect(results[0].ingredients).toHaveLength(3);
    expect(results[0].ingredients.map(i => i.name)).toContain('chocolate');
    expect(results[0].categories).toContain('Dessert');
  });

  it('should filter recipes by text query in description', async () => {
    await createTestData();
    const input: SearchRecipesInput = { query: 'italian' };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Pasta Carbonara');
    expect(results[0].description).toContain('Italian');
  });

  it('should filter recipes by author_id', async () => {
    const { users } = await createTestData();
    const input: SearchRecipesInput = { author_id: users[1].id };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    expect(results.map(r => r.title).sort()).toEqual([
      'Chicken Stir Fry',
      'Vegetarian Pizza'
    ]);
    expect(results.every(r => r.author_id === users[1].id)).toBe(true);
    expect(results.every(r => r.author_username === 'chef_bob')).toBe(true);
  });

  it('should filter recipes by single category', async () => {
    await createTestData();
    const input: SearchRecipesInput = { categories: ['Dessert'] };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Cake');
    expect(results[0].categories).toContain('Dessert');
  });

  it('should filter recipes by multiple categories', async () => {
    await createTestData();
    const input: SearchRecipesInput = { categories: ['Main Course', 'Vegetarian'] };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    expect(results.map(r => r.title).sort()).toEqual([
      'Chicken Stir Fry',
      'Pasta Carbonara',
      'Vegetarian Pizza'
    ]);
  });

  it('should filter recipes by ingredients', async () => {
    await createTestData();
    const input: SearchRecipesInput = { ingredients: ['cheese'] };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(2);
    expect(results.map(r => r.title).sort()).toEqual([
      'Pasta Carbonara',
      'Vegetarian Pizza'
    ]);
    
    results.forEach(recipe => {
      expect(recipe.ingredients.some(i => i.name.includes('cheese'))).toBe(true);
    });
  });

  it('should filter recipes by multiple ingredients', async () => {
    await createTestData();
    const input: SearchRecipesInput = { ingredients: ['eggs', 'chicken'] };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(3);
    expect(results.map(r => r.title).sort()).toEqual([
      'Chicken Stir Fry',
      'Chocolate Cake',
      'Pasta Carbonara'
    ]);
  });

  it('should combine multiple filters correctly', async () => {
    const { users } = await createTestData();
    const input: SearchRecipesInput = {
      author_id: users[0].id,
      categories: ['Main Course']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Pasta Carbonara');
    expect(results[0].author_id).toEqual(users[0].id);
    expect(results[0].categories).toContain('Main Course');
  });

  it('should return empty array when no recipes match filters', async () => {
    await createTestData();
    const input: SearchRecipesInput = { 
      query: 'nonexistent dish',
      categories: ['Gluten-Free']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(0);
  });

  it('should handle case-insensitive text search', async () => {
    await createTestData();
    const input: SearchRecipesInput = { query: 'CHOCOLATE' };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Cake');
  });

  it('should handle partial ingredient name matches', async () => {
    await createTestData();
    const input: SearchRecipesInput = { ingredients: ['choco'] };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Chocolate Cake');
    expect(results[0].ingredients.some(i => i.name.includes('chocolate'))).toBe(true);
  });

  it('should return recipes with complete ingredient and category data', async () => {
    await createTestData();
    const input: SearchRecipesInput = { query: 'carbonara' };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    const recipe = results[0];
    
    expect(recipe.ingredients).toHaveLength(3);
    expect(recipe.ingredients.map(i => i.name).sort()).toEqual(['cheese', 'eggs', 'pasta']);
    expect(recipe.ingredients.every(i => i.quantity)).toBe(true);
    expect(recipe.ingredients.every(i => i.recipe_id === recipe.id)).toBe(true);
    
    expect(recipe.categories).toHaveLength(2);
    expect(recipe.categories.sort()).toEqual(['Lunch', 'Main Course']);
  });

  it('should handle complex multi-criteria search', async () => {
    const { users } = await createTestData();
    const input: SearchRecipesInput = {
      query: 'pasta',
      author_id: users[0].id,
      categories: ['Main Course'],
      ingredients: ['eggs']
    };

    const results = await searchRecipes(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Pasta Carbonara');
    expect(results[0].author_id).toEqual(users[0].id);
    expect(results[0].categories).toContain('Main Course');
    expect(results[0].ingredients.some(i => i.name === 'eggs')).toBe(true);
  });

  it('should return recipes in consistent order', async () => {
    await createTestData();
    const input: SearchRecipesInput = {};

    const results1 = await searchRecipes(input);
    const results2 = await searchRecipes(input);

    expect(results1.map(r => r.id)).toEqual(results2.map(r => r.id));
  });
});
