import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, usersTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

// Simple test input
const testInput: CreateRecipeInput = {
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: ['2 cups flour', '1 cup sugar', '2 eggs'],
  instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes'],
  prep_time_minutes: 15,
  cook_time_minutes: 30,
  servings: 6,
  category: 'dessert',
  user_id: 1 // Will be set to actual user ID in tests
};

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a recipe with all fields', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    // Update test input with actual user ID
    const recipeInput = { ...testInput, user_id: createdUser.id };
    
    const result = await createRecipe(recipeInput);

    // Basic field validation
    expect(result.title).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.ingredients).toEqual(['2 cups flour', '1 cup sugar', '2 eggs']);
    expect(result.instructions).toEqual(['Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes']);
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(30);
    expect(result.servings).toEqual(6);
    expect(result.category).toEqual('dessert');
    expect(result.user_id).toEqual(createdUser.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a recipe with nullable fields as null', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    // Test input with nullable fields set to null
    const minimalInput: CreateRecipeInput = {
      title: 'Minimal Recipe',
      description: null,
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      category: 'main_course',
      user_id: createdUser.id
    };
    
    const result = await createRecipe(minimalInput);

    expect(result.title).toEqual('Minimal Recipe');
    expect(result.description).toBeNull();
    expect(result.ingredients).toEqual(['ingredient 1']);
    expect(result.instructions).toEqual(['step 1']);
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
    expect(result.category).toEqual('main_course');
    expect(result.user_id).toEqual(createdUser.id);
  });

  it('should save recipe to database', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    const recipeInput = { ...testInput, user_id: createdUser.id };
    const result = await createRecipe(recipeInput);

    // Query using proper drizzle syntax
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('Test Recipe');
    expect(recipes[0].description).toEqual('A delicious test recipe');
    expect(recipes[0].ingredients).toEqual(['2 cups flour', '1 cup sugar', '2 eggs']);
    expect(recipes[0].instructions).toEqual(['Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes']);
    expect(recipes[0].prep_time_minutes).toEqual(15);
    expect(recipes[0].cook_time_minutes).toEqual(30);
    expect(recipes[0].servings).toEqual(6);
    expect(recipes[0].category).toEqual('dessert');
    expect(recipes[0].user_id).toEqual(createdUser.id);
    expect(recipes[0].created_at).toBeInstanceOf(Date);
    expect(recipes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different recipe categories', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    const categories = ['appetizer', 'main_course', 'dessert', 'beverage', 'breakfast'] as const;
    
    for (const category of categories) {
      const recipeInput: CreateRecipeInput = {
        ...testInput,
        title: `${category} Recipe`,
        category: category,
        user_id: createdUser.id
      };
      
      const result = await createRecipe(recipeInput);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`${category} Recipe`);
    }
  });

  it('should handle complex ingredients and instructions arrays', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    const complexInput: CreateRecipeInput = {
      title: 'Complex Recipe',
      description: 'A recipe with many steps',
      ingredients: [
        '2 cups all-purpose flour',
        '1/2 cup unsalted butter, softened',
        '3/4 cup granulated sugar',
        '2 large eggs, room temperature',
        '1 tsp vanilla extract',
        '1/2 cup whole milk'
      ],
      instructions: [
        'Preheat oven to 350°F (175°C)',
        'In a large bowl, cream together butter and sugar until light and fluffy',
        'Beat in eggs one at a time, then add vanilla',
        'In a separate bowl, whisk together flour and salt',
        'Alternately add flour mixture and milk to the butter mixture',
        'Pour into prepared pan and bake for 25-30 minutes',
        'Cool completely before serving'
      ],
      prep_time_minutes: 20,
      cook_time_minutes: 30,
      servings: 8,
      category: 'dessert',
      user_id: createdUser.id
    };
    
    const result = await createRecipe(complexInput);

    expect(result.ingredients).toHaveLength(6);
    expect(result.instructions).toHaveLength(7);
    expect(result.ingredients[0]).toEqual('2 cups all-purpose flour');
    expect(result.instructions[0]).toEqual('Preheat oven to 350°F (175°C)');
  });

  it('should throw error when user does not exist', async () => {
    // Try to create recipe with non-existent user ID
    const invalidInput = { ...testInput, user_id: 999 };
    
    await expect(createRecipe(invalidInput)).rejects.toThrow(/User not found/i);
  });

  it('should preserve timestamps when created', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    const beforeCreate = new Date();
    const recipeInput = { ...testInput, user_id: createdUser.id };
    const result = await createRecipe(recipeInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
