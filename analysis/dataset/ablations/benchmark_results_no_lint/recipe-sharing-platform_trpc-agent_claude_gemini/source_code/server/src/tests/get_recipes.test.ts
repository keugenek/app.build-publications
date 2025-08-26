import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { getRecipes } from '../handlers/get_recipes';

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test users
  const createTestUsers = async () => {
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          name: 'Alice Smith'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          name: 'Bob Jones'
        }
      ])
      .returning()
      .execute();
    return users;
  };

  // Helper function to create test recipes
  const createTestRecipes = async (users: any[]) => {
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'Chocolate Cake',
          description: 'Delicious chocolate cake',
          ingredients: ['flour', 'cocoa', 'sugar', 'eggs'],
          instructions: ['Mix ingredients', 'Bake at 350F', 'Cool and serve'],
          prep_time_minutes: 30,
          cook_time_minutes: 45,
          servings: 8,
          category: 'dessert',
          user_id: users[0].id
        },
        {
          title: 'Caesar Salad',
          description: 'Fresh Caesar salad',
          ingredients: ['lettuce', 'croutons', 'parmesan', 'dressing'],
          instructions: ['Chop lettuce', 'Add toppings', 'Toss with dressing'],
          prep_time_minutes: 15,
          cook_time_minutes: null,
          servings: 4,
          category: 'salad',
          user_id: users[1].id
        },
        {
          title: 'Morning Smoothie',
          description: null,
          ingredients: ['banana', 'berries', 'yogurt'],
          instructions: ['Blend all ingredients'],
          prep_time_minutes: 5,
          cook_time_minutes: null,
          servings: 1,
          category: 'breakfast',
          user_id: users[0].id
        }
      ])
      .returning()
      .execute();
    return recipes;
  };

  it('should return all recipes with user information when no userId provided', async () => {
    const users = await createTestUsers();
    const recipes = await createTestRecipes(users);

    const result = await getRecipes();

    expect(result).toHaveLength(3);
    
    // Check first recipe (should be newest first due to ordering)
    const smoothieRecipe = result.find(r => r.title === 'Morning Smoothie');
    expect(smoothieRecipe).toBeDefined();
    expect(smoothieRecipe?.user_name).toEqual('Alice Smith');
    expect(smoothieRecipe?.ingredients).toEqual(['banana', 'berries', 'yogurt']);
    expect(smoothieRecipe?.instructions).toEqual(['Blend all ingredients']);
    expect(smoothieRecipe?.category).toEqual('breakfast');
    expect(smoothieRecipe?.is_favorite).toBeUndefined();
    
    // Check recipe with null description
    expect(smoothieRecipe?.description).toBeNull();
    
    // Verify all recipes have user names
    result.forEach(recipe => {
      expect(recipe.user_name).toBeDefined();
      expect(typeof recipe.user_name).toBe('string');
      expect(recipe.is_favorite).toBeUndefined();
    });
  });

  it('should return recipes ordered by creation date (newest first)', async () => {
    const users = await createTestUsers();
    await createTestRecipes(users);

    // Wait a bit and create another recipe to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(recipesTable)
      .values({
        title: 'Late Night Snack',
        description: 'Quick snack',
        ingredients: ['crackers', 'cheese'],
        instructions: ['Arrange crackers', 'Add cheese'],
        prep_time_minutes: 2,
        cook_time_minutes: null,
        servings: 1,
        category: 'snack',
        user_id: users[0].id
      })
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(4);
    
    // Verify ordering (newest first)
    expect(result[0].title).toEqual('Late Night Snack');
    
    // Check that dates are in descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i-1].created_at >= result[i].created_at).toBe(true);
    }
  });

  it('should mark favorite recipes when userId is provided', async () => {
    const users = await createTestUsers();
    const recipes = await createTestRecipes(users);

    // Add some favorites for user1
    await db.insert(favoriteRecipesTable)
      .values([
        {
          user_id: users[0].id,
          recipe_id: recipes[1].id // Caesar Salad
        }
      ])
      .execute();

    const result = await getRecipes(users[0].id);

    expect(result).toHaveLength(3);
    
    // Find the favorite recipe
    const caesarSalad = result.find(r => r.title === 'Caesar Salad');
    expect(caesarSalad?.is_favorite).toBe(true);
    
    // Find non-favorite recipes
    const chocolateCake = result.find(r => r.title === 'Chocolate Cake');
    const smoothie = result.find(r => r.title === 'Morning Smoothie');
    expect(chocolateCake?.is_favorite).toBe(false);
    expect(smoothie?.is_favorite).toBe(false);
  });

  it('should handle user with no favorites', async () => {
    const users = await createTestUsers();
    await createTestRecipes(users);

    // Add favorite for user1 but query for user2
    const recipes = await db.select().from(recipesTable).execute();
    await db.insert(favoriteRecipesTable)
      .values({
        user_id: users[0].id,
        recipe_id: recipes[0].id
      })
      .execute();

    const result = await getRecipes(users[1].id);

    expect(result).toHaveLength(3);
    
    // All should be marked as not favorites for user2
    result.forEach(recipe => {
      expect(recipe.is_favorite).toBe(false);
    });
  });

  it('should return empty array when no recipes exist', async () => {
    await createTestUsers(); // Create users but no recipes

    const result = await getRecipes();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle recipes with all nullable fields as null', async () => {
    const users = await createTestUsers();
    
    await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null,
        ingredients: ['water'],
        instructions: ['Drink water'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        category: 'beverage',
        user_id: users[0].id
      })
      .execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(recipe.title).toEqual('Minimal Recipe');
    expect(recipe.description).toBeNull();
    expect(recipe.prep_time_minutes).toBeNull();
    expect(recipe.cook_time_minutes).toBeNull();
    expect(recipe.servings).toBeNull();
    expect(recipe.user_name).toEqual('Alice Smith');
    expect(recipe.ingredients).toEqual(['water']);
    expect(recipe.instructions).toEqual(['Drink water']);
  });

  it('should handle multiple favorites correctly', async () => {
    const users = await createTestUsers();
    const recipes = await createTestRecipes(users);

    // Add multiple favorites for user1
    await db.insert(favoriteRecipesTable)
      .values([
        {
          user_id: users[0].id,
          recipe_id: recipes[0].id // Chocolate Cake
        },
        {
          user_id: users[0].id,
          recipe_id: recipes[2].id // Morning Smoothie
        }
      ])
      .execute();

    const result = await getRecipes(users[0].id);

    expect(result).toHaveLength(3);
    
    const chocolateCake = result.find(r => r.title === 'Chocolate Cake');
    const caesarSalad = result.find(r => r.title === 'Caesar Salad');
    const smoothie = result.find(r => r.title === 'Morning Smoothie');
    
    expect(chocolateCake?.is_favorite).toBe(true);
    expect(caesarSalad?.is_favorite).toBe(false);
    expect(smoothie?.is_favorite).toBe(true);
  });
});
