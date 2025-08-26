import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { type GetRecipeByIdInput, type CreateUserInput } from '../schema';
import { getRecipeById } from '../handlers/get_recipe_by_id';

// Test data
const testUser: CreateUserInput = {
  username: 'testchef',
  email: 'chef@example.com'
};

const testRecipe = {
  title: 'Chocolate Chip Cookies',
  description: 'Classic homemade chocolate chip cookies',
  ingredients: ['2 cups flour', '1 cup butter', '1/2 cup brown sugar', '1/2 cup white sugar', '2 eggs', '1 cup chocolate chips'],
  instructions: ['Preheat oven to 375°F', 'Mix dry ingredients', 'Cream butter and sugars', 'Add eggs', 'Combine wet and dry ingredients', 'Fold in chocolate chips', 'Bake for 10-12 minutes'],
  categories: ['dessert', 'comfort_food'],
  prep_time_minutes: 15,
  cook_time_minutes: 12,
  servings: 24,
  difficulty: 'easy' as const,
  author_id: 0 // Will be set after user creation
};

describe('getRecipeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a recipe when it exists', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: userId
      })
      .returning()
      .execute();
    
    const recipeId = recipeResult[0].id;

    // Test the handler
    const input: GetRecipeByIdInput = { id: recipeId };
    const result = await getRecipeById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Chocolate Chip Cookies');
    expect(result!.description).toEqual('Classic homemade chocolate chip cookies');
    expect(result!.ingredients).toEqual(['2 cups flour', '1 cup butter', '1/2 cup brown sugar', '1/2 cup white sugar', '2 eggs', '1 cup chocolate chips']);
    expect(result!.instructions).toEqual(['Preheat oven to 375°F', 'Mix dry ingredients', 'Cream butter and sugars', 'Add eggs', 'Combine wet and dry ingredients', 'Fold in chocolate chips', 'Bake for 10-12 minutes']);
    expect(result!.categories).toEqual(['dessert', 'comfort_food']);
    expect(result!.prep_time_minutes).toEqual(15);
    expect(result!.cook_time_minutes).toEqual(12);
    expect(result!.servings).toEqual(24);
    expect(result!.difficulty).toEqual('easy');
    expect(result!.author_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when recipe does not exist', async () => {
    const input: GetRecipeByIdInput = { id: 999 };
    const result = await getRecipeById(input);

    expect(result).toBeNull();
  });

  it('should handle recipe with minimal data', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create recipe with minimal data (nullables as null)
    const minimalRecipe = {
      title: 'Simple Recipe',
      description: null,
      ingredients: ['ingredient1'],
      instructions: ['step1'],
      categories: ['breakfast'],
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      difficulty: null,
      author_id: userId
    };

    const recipeResult = await db.insert(recipesTable)
      .values(minimalRecipe)
      .returning()
      .execute();
    
    const recipeId = recipeResult[0].id;

    // Test the handler
    const input: GetRecipeByIdInput = { id: recipeId };
    const result = await getRecipeById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Simple Recipe');
    expect(result!.description).toBeNull();
    expect(result!.ingredients).toEqual(['ingredient1']);
    expect(result!.instructions).toEqual(['step1']);
    expect(result!.categories).toEqual(['breakfast']);
    expect(result!.prep_time_minutes).toBeNull();
    expect(result!.cook_time_minutes).toBeNull();
    expect(result!.servings).toBeNull();
    expect(result!.difficulty).toBeNull();
    expect(result!.author_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle recipe with complex JSON arrays', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create recipe with complex JSON data
    const complexRecipe = {
      title: 'Complex Multi-Course Meal',
      description: 'A sophisticated dinner recipe',
      ingredients: [
        '2 lbs beef tenderloin, trimmed',
        '1/4 cup olive oil',
        '2 tbsp fresh thyme',
        '4 cloves garlic, minced',
        '1 cup red wine',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Let beef come to room temperature for 30 minutes',
        'Season generously with salt and pepper',
        'Heat oil in cast iron skillet over high heat',
        'Sear beef on all sides until browned',
        'Transfer to preheated 425°F oven',
        'Roast for 15-20 minutes for medium-rare',
        'Rest for 10 minutes before slicing'
      ],
      categories: ['dinner', 'main_course', 'comfort_food'],
      prep_time_minutes: 45,
      cook_time_minutes: 25,
      servings: 6,
      difficulty: 'hard' as const,
      author_id: userId
    };

    const recipeResult = await db.insert(recipesTable)
      .values(complexRecipe)
      .returning()
      .execute();
    
    const recipeId = recipeResult[0].id;

    // Test the handler
    const input: GetRecipeByIdInput = { id: recipeId };
    const result = await getRecipeById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recipeId);
    expect(result!.title).toEqual('Complex Multi-Course Meal');
    expect(result!.ingredients).toHaveLength(6);
    expect(result!.ingredients[0]).toEqual('2 lbs beef tenderloin, trimmed');
    expect(result!.instructions).toHaveLength(7);
    expect(result!.instructions[0]).toEqual('Let beef come to room temperature for 30 minutes');
    expect(result!.categories).toEqual(['dinner', 'main_course', 'comfort_food']);
    expect(result!.categories).toHaveLength(3);
    expect(result!.difficulty).toEqual('hard');
    expect(result!.servings).toEqual(6);
  });
});
