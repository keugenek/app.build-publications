import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, usersTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Test input data
const testUser = {
  username: 'testchef',
  email: 'testchef@example.com'
};

const testRecipeInput: CreateRecipeInput = {
  title: 'Chocolate Chip Cookies',
  description: 'Delicious homemade chocolate chip cookies',
  ingredients: ['2 cups flour', '1 cup butter', '1/2 cup sugar', '1/2 cup brown sugar', '2 eggs', '1 tsp vanilla', '1 tsp baking soda', '1/2 tsp salt', '2 cups chocolate chips'],
  instructions: ['Preheat oven to 375F', 'Mix dry ingredients', 'Cream butter and sugars', 'Add eggs and vanilla', 'Combine wet and dry ingredients', 'Fold in chocolate chips', 'Drop onto baking sheet', 'Bake 9-11 minutes'],
  categories: ['dessert', 'comfort_food'],
  prep_time_minutes: 15,
  cook_time_minutes: 11,
  servings: 24,
  difficulty: 'easy',
  author_id: 1 // Will be set after creating user
};

describe('createRecipe', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
    testRecipeInput.author_id = testUserId;
  });

  afterEach(resetDB);

  it('should create a recipe with all fields', async () => {
    const result = await createRecipe(testRecipeInput);

    // Basic field validation
    expect(result.title).toEqual('Chocolate Chip Cookies');
    expect(result.description).toEqual('Delicious homemade chocolate chip cookies');
    expect(result.ingredients).toEqual(testRecipeInput.ingredients);
    expect(result.instructions).toEqual(testRecipeInput.instructions);
    expect(result.categories).toEqual(['dessert', 'comfort_food']);
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(11);
    expect(result.servings).toEqual(24);
    expect(result.difficulty).toEqual('easy');
    expect(result.author_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create recipe with minimal required fields', async () => {
    const minimalInput: CreateRecipeInput = {
      title: 'Simple Salad',
      ingredients: ['lettuce', 'tomatoes'],
      instructions: ['Wash lettuce', 'Chop vegetables', 'Mix together'],
      categories: ['salad'],
      author_id: testUserId
    };

    const result = await createRecipe(minimalInput);

    expect(result.title).toEqual('Simple Salad');
    expect(result.description).toBeNull();
    expect(result.ingredients).toEqual(['lettuce', 'tomatoes']);
    expect(result.instructions).toEqual(['Wash lettuce', 'Chop vegetables', 'Mix together']);
    expect(result.categories).toEqual(['salad']);
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
    expect(result.difficulty).toBeNull();
    expect(result.author_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save recipe to database correctly', async () => {
    const result = await createRecipe(testRecipeInput);

    // Query database to verify recipe was saved
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    const savedRecipe = recipes[0];
    
    expect(savedRecipe.title).toEqual('Chocolate Chip Cookies');
    expect(savedRecipe.description).toEqual('Delicious homemade chocolate chip cookies');
    expect(savedRecipe.ingredients).toEqual(testRecipeInput.ingredients);
    expect(savedRecipe.instructions).toEqual(testRecipeInput.instructions);
    expect(savedRecipe.categories).toEqual(['dessert', 'comfort_food']);
    expect(savedRecipe.prep_time_minutes).toEqual(15);
    expect(savedRecipe.cook_time_minutes).toEqual(11);
    expect(savedRecipe.servings).toEqual(24);
    expect(savedRecipe.difficulty).toEqual('easy');
    expect(savedRecipe.author_id).toEqual(testUserId);
    expect(savedRecipe.created_at).toBeInstanceOf(Date);
    expect(savedRecipe.updated_at).toBeInstanceOf(Date);
  });

  it('should handle recipe with multiple categories', async () => {
    const multiCategoryInput: CreateRecipeInput = {
      title: 'Vegan Gluten-Free Smoothie',
      ingredients: ['banana', 'almond milk', 'spinach', 'chia seeds'],
      instructions: ['Blend all ingredients', 'Serve immediately'],
      categories: ['breakfast', 'beverage', 'vegan', 'gluten_free', 'healthy'],
      author_id: testUserId
    };

    const result = await createRecipe(multiCategoryInput);

    expect(result.categories).toEqual(['breakfast', 'beverage', 'vegan', 'gluten_free', 'healthy']);
  });

  it('should throw error when author does not exist', async () => {
    const invalidInput: CreateRecipeInput = {
      ...testRecipeInput,
      author_id: 99999 // Non-existent user ID
    };

    await expect(createRecipe(invalidInput)).rejects.toThrow(/Author with id 99999 does not exist/);
  });

  it('should handle complex recipe data correctly', async () => {
    const complexRecipeInput: CreateRecipeInput = {
      title: 'Beef Wellington',
      description: 'A classic British dish with beef tenderloin, mushroom duxelles, and puff pastry',
      ingredients: [
        '2 lbs beef tenderloin',
        '1 lb puff pastry',
        '8 oz mushrooms',
        '4 slices prosciutto',
        '2 tbsp Dijon mustard',
        '2 egg yolks',
        'salt and pepper'
      ],
      instructions: [
        'Season beef with salt and pepper',
        'Sear beef in hot pan',
        'Cool completely',
        'Prepare mushroom duxelles',
        'Lay out prosciutto on plastic wrap',
        'Spread mushroom mixture over prosciutto',
        'Brush beef with mustard',
        'Wrap beef in prosciutto and mushroom mixture',
        'Wrap in puff pastry',
        'Brush with egg wash',
        'Bake at 400F for 25-30 minutes'
      ],
      categories: ['dinner', 'main_course'],
      prep_time_minutes: 60,
      cook_time_minutes: 30,
      servings: 6,
      difficulty: 'hard',
      author_id: testUserId
    };

    const result = await createRecipe(complexRecipeInput);

    expect(result.title).toEqual('Beef Wellington');
    expect(result.difficulty).toEqual('hard');
    expect(result.ingredients).toHaveLength(7);
    expect(result.instructions).toHaveLength(11);
    expect(result.prep_time_minutes).toEqual(60);
    expect(result.cook_time_minutes).toEqual(30);
  });

  it('should create recipe with null optional fields when not provided', async () => {
    const inputWithUndefinedOptionals: CreateRecipeInput = {
      title: 'Quick Snack',
      ingredients: ['apple', 'peanut butter'],
      instructions: ['Slice apple', 'Spread peanut butter'],
      categories: ['snack'],
      author_id: testUserId,
      description: undefined,
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      servings: undefined,
      difficulty: undefined
    };

    const result = await createRecipe(inputWithUndefinedOptionals);

    expect(result.description).toBeNull();
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
    expect(result.difficulty).toBeNull();
  });
});
