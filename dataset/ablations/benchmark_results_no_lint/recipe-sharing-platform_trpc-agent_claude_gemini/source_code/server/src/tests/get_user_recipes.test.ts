import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { getUserRecipes } from '../handlers/get_user_recipes';

describe('getUserRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipes for a specific user', async () => {
    // Create test users
    const [user1, user2] = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          name: 'User 1'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          name: 'User 2'
        }
      ])
      .returning()
      .execute();

    // Create recipes for both users
    await db.insert(recipesTable)
      .values([
        {
          title: 'User 1 Recipe 1',
          description: 'First recipe by user 1',
          ingredients: ['flour', 'eggs'],
          instructions: ['mix flour', 'add eggs'],
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          servings: 4,
          category: 'breakfast',
          user_id: user1.id
        },
        {
          title: 'User 1 Recipe 2',
          description: 'Second recipe by user 1',
          ingredients: ['rice', 'vegetables'],
          instructions: ['cook rice', 'add vegetables'],
          prep_time_minutes: 5,
          cook_time_minutes: 15,
          servings: 2,
          category: 'lunch',
          user_id: user1.id
        },
        {
          title: 'User 2 Recipe',
          description: 'Recipe by user 2',
          ingredients: ['pasta', 'sauce'],
          instructions: ['boil pasta', 'add sauce'],
          prep_time_minutes: 15,
          cook_time_minutes: 25,
          servings: 3,
          category: 'dinner',
          user_id: user2.id
        }
      ])
      .execute();

    // Get recipes for user 1
    const recipes = await getUserRecipes(user1.id);

    // Should return only user 1's recipes
    expect(recipes).toHaveLength(2);
    expect(recipes.every(recipe => recipe.user_id === user1.id)).toBe(true);
    
    // Verify recipe content
    const recipeTitles = recipes.map(r => r.title);
    expect(recipeTitles).toContain('User 1 Recipe 1');
    expect(recipeTitles).toContain('User 1 Recipe 2');
    expect(recipeTitles).not.toContain('User 2 Recipe');

    // Verify all fields are present
    recipes.forEach(recipe => {
      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBeDefined();
      expect(recipe.ingredients).toBeInstanceOf(Array);
      expect(recipe.instructions).toBeInstanceOf(Array);
      expect(recipe.category).toBeDefined();
      expect(recipe.created_at).toBeInstanceOf(Date);
      expect(recipe.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return recipes ordered by creation date (newest first)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hash',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create recipes with slight delay to ensure different timestamps
    const recipe1 = await db.insert(recipesTable)
      .values({
        title: 'First Recipe',
        description: 'Created first',
        ingredients: ['ingredient1'],
        instructions: ['instruction1'],
        category: 'breakfast',
        user_id: user.id
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const recipe2 = await db.insert(recipesTable)
      .values({
        title: 'Second Recipe',
        description: 'Created second',
        ingredients: ['ingredient2'],
        instructions: ['instruction2'],
        category: 'lunch',
        user_id: user.id
      })
      .returning()
      .execute();

    const recipes = await getUserRecipes(user.id);

    // Should return 2 recipes
    expect(recipes).toHaveLength(2);

    // Should be ordered by creation date (newest first)
    expect(recipes[0].created_at >= recipes[1].created_at).toBe(true);
    expect(recipes[0].title).toBe('Second Recipe'); // Most recent
    expect(recipes[1].title).toBe('First Recipe'); // Older
  });

  it('should return empty array for user with no recipes', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hash',
        name: 'Test User'
      })
      .returning()
      .execute();

    const recipes = await getUserRecipes(user.id);

    expect(recipes).toHaveLength(0);
    expect(recipes).toEqual([]);
  });

  it('should return empty array for non-existent user', async () => {
    const recipes = await getUserRecipes(999); // Non-existent user ID

    expect(recipes).toHaveLength(0);
    expect(recipes).toEqual([]);
  });

  it('should handle recipes with null optional fields correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hash',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create recipe with minimal required fields
    await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null, // Explicitly null
        ingredients: ['basic ingredient'],
        instructions: ['basic instruction'],
        prep_time_minutes: null, // Explicitly null
        cook_time_minutes: null, // Explicitly null
        servings: null, // Explicitly null
        category: 'snack',
        user_id: user.id
      })
      .execute();

    const recipes = await getUserRecipes(user.id);

    expect(recipes).toHaveLength(1);
    const recipe = recipes[0];
    
    expect(recipe.title).toBe('Minimal Recipe');
    expect(recipe.description).toBeNull();
    expect(recipe.prep_time_minutes).toBeNull();
    expect(recipe.cook_time_minutes).toBeNull();
    expect(recipe.servings).toBeNull();
    expect(recipe.ingredients).toEqual(['basic ingredient']);
    expect(recipe.instructions).toEqual(['basic instruction']);
  });
});
