import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { getUserRecipes } from '../handlers/get_user_recipes';

describe('getUserRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no recipes', async () => {
    // Create a user but no recipes
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const result = await getUserRecipes(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return user recipes with all details', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        username: 'chef_user',
        email: 'chef@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create a recipe for this user
    const recipes = await db.insert(recipesTable)
      .values({
        title: 'User\'s Special Recipe',
        description: 'A delicious recipe created by the user',
        instructions: 'Mix all ingredients and cook well',
        author_id: userId
      })
      .returning()
      .execute();

    const recipeId = recipes[0].id;

    // Add ingredients to the recipe
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
        }
      ])
      .execute();

    // Add categories to the recipe
    await db.insert(recipeCategoriesTable)
      .values([
        {
          recipe_id: recipeId,
          category: 'Dessert'
        },
        {
          recipe_id: recipeId,
          category: 'Vegetarian'
        }
      ])
      .execute();

    const result = await getUserRecipes(userId);

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(recipe.id).toEqual(recipeId);
    expect(recipe.title).toEqual('User\'s Special Recipe');
    expect(recipe.description).toEqual('A delicious recipe created by the user');
    expect(recipe.instructions).toEqual('Mix all ingredients and cook well');
    expect(recipe.author_id).toEqual(userId);
    expect(recipe.author_username).toEqual('chef_user');
    expect(recipe.created_at).toBeInstanceOf(Date);
    expect(recipe.updated_at).toBeInstanceOf(Date);

    // Check ingredients
    expect(recipe.ingredients).toHaveLength(2);
    const ingredientNames = recipe.ingredients.map(ing => ing.name).sort();
    expect(ingredientNames).toEqual(['Flour', 'Sugar']);
    
    const flourIngredient = recipe.ingredients.find(ing => ing.name === 'Flour');
    expect(flourIngredient?.quantity).toEqual('2');
    expect(flourIngredient?.unit).toEqual('cups');

    // Check categories
    expect(recipe.categories).toHaveLength(2);
    expect(recipe.categories.sort()).toEqual(['Dessert', 'Vegetarian']);
  });

  it('should return multiple recipes ordered by creation date descending', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        username: 'prolific_chef',
        email: 'prolific@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create multiple recipes with slight delay to ensure different timestamps
    const recipe1 = await db.insert(recipesTable)
      .values({
        title: 'First Recipe',
        description: 'The first recipe',
        instructions: 'First instructions',
        author_id: userId
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const recipe2 = await db.insert(recipesTable)
      .values({
        title: 'Second Recipe',
        description: 'The second recipe',
        instructions: 'Second instructions',
        author_id: userId
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const recipe3 = await db.insert(recipesTable)
      .values({
        title: 'Third Recipe',
        description: 'The third recipe',
        instructions: 'Third instructions',
        author_id: userId
      })
      .returning()
      .execute();

    // Add some ingredients and categories to verify proper association
    await db.insert(ingredientsTable)
      .values([
        {
          recipe_id: recipe1[0].id,
          name: 'Ingredient 1',
          quantity: '1',
          unit: 'piece'
        },
        {
          recipe_id: recipe3[0].id,
          name: 'Ingredient 3',
          quantity: '3',
          unit: 'pieces'
        }
      ])
      .execute();

    await db.insert(recipeCategoriesTable)
      .values([
        {
          recipe_id: recipe1[0].id,
          category: 'Breakfast'
        },
        {
          recipe_id: recipe2[0].id,
          category: 'Lunch'
        }
      ])
      .execute();

    const result = await getUserRecipes(userId);

    expect(result).toHaveLength(3);

    // Verify ordering (most recent first)
    expect(result[0].title).toEqual('Third Recipe');
    expect(result[1].title).toEqual('Second Recipe');
    expect(result[2].title).toEqual('First Recipe');

    // Verify that each recipe has correct associated data
    const thirdRecipe = result[0];
    expect(thirdRecipe.ingredients).toHaveLength(1);
    expect(thirdRecipe.ingredients[0].name).toEqual('Ingredient 3');
    expect(thirdRecipe.categories).toHaveLength(0);

    const secondRecipe = result[1];
    expect(secondRecipe.ingredients).toHaveLength(0);
    expect(secondRecipe.categories).toEqual(['Lunch']);

    const firstRecipe = result[2];
    expect(firstRecipe.ingredients).toHaveLength(1);
    expect(firstRecipe.ingredients[0].name).toEqual('Ingredient 1');
    expect(firstRecipe.categories).toEqual(['Breakfast']);
  });

  it('should only return recipes for the specified user', async () => {
    // Create two different users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create recipes for both users
    await db.insert(recipesTable)
      .values([
        {
          title: 'User1 Recipe',
          description: 'Recipe by user 1',
          instructions: 'User 1 instructions',
          author_id: user1Id
        },
        {
          title: 'User2 Recipe',
          description: 'Recipe by user 2',
          instructions: 'User 2 instructions',
          author_id: user2Id
        }
      ])
      .execute();

    // Get recipes for user1 only
    const user1Recipes = await getUserRecipes(user1Id);
    
    expect(user1Recipes).toHaveLength(1);
    expect(user1Recipes[0].title).toEqual('User1 Recipe');
    expect(user1Recipes[0].author_id).toEqual(user1Id);
    expect(user1Recipes[0].author_username).toEqual('user1');

    // Get recipes for user2 only
    const user2Recipes = await getUserRecipes(user2Id);
    
    expect(user2Recipes).toHaveLength(1);
    expect(user2Recipes[0].title).toEqual('User2 Recipe');
    expect(user2Recipes[0].author_id).toEqual(user2Id);
    expect(user2Recipes[0].author_username).toEqual('user2');
  });

  it('should handle recipes with no ingredients or categories', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        username: 'minimal_chef',
        email: 'minimal@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create a recipe without ingredients or categories
    const recipes = await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: 'A recipe with no ingredients or categories',
        instructions: 'Just do it somehow',
        author_id: userId
      })
      .returning()
      .execute();

    const result = await getUserRecipes(userId);

    expect(result).toHaveLength(1);
    
    const recipe = result[0];
    expect(recipe.title).toEqual('Minimal Recipe');
    expect(recipe.ingredients).toHaveLength(0);
    expect(recipe.categories).toHaveLength(0);
    expect(recipe.author_username).toEqual('minimal_chef');
  });
});
