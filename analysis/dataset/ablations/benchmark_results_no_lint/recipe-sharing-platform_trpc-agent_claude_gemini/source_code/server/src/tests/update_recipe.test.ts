import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { type UpdateRecipeInput } from '../schema';
import { updateRecipe } from '../handlers/update_recipe';
import { eq, and } from 'drizzle-orm';

describe('updateRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test user and recipe before each test
  let testUserId: number;
  let testRecipeId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create another user for unauthorized tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashed_password',
        name: 'Other User'
      })
      .returning()
      .execute();
    otherUserId = otherUserResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Original Recipe',
        description: 'Original description',
        ingredients: ['ingredient 1', 'ingredient 2'],
        instructions: ['step 1', 'step 2'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 2,
        category: 'main_course',
        user_id: testUserId
      })
      .returning()
      .execute();
    testRecipeId = recipeResult[0].id;
  });

  it('should update all fields of a recipe', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Updated Recipe Title',
      description: 'Updated description',
      ingredients: ['new ingredient 1', 'new ingredient 2', 'new ingredient 3'],
      instructions: ['new step 1', 'new step 2'],
      prep_time_minutes: 15,
      cook_time_minutes: 25,
      servings: 4,
      category: 'dessert',
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testRecipeId);
    expect(result!.title).toEqual('Updated Recipe Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.ingredients).toEqual(['new ingredient 1', 'new ingredient 2', 'new ingredient 3']);
    expect(result!.instructions).toEqual(['new step 1', 'new step 2']);
    expect(result!.prep_time_minutes).toEqual(15);
    expect(result!.cook_time_minutes).toEqual(25);
    expect(result!.servings).toEqual(4);
    expect(result!.category).toEqual('dessert');
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Only Title Updated',
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Only Title Updated');
    // Other fields should remain unchanged
    expect(result!.description).toEqual('Original description');
    expect(result!.ingredients).toEqual(['ingredient 1', 'ingredient 2']);
    expect(result!.instructions).toEqual(['step 1', 'step 2']);
    expect(result!.prep_time_minutes).toEqual(10);
    expect(result!.cook_time_minutes).toEqual(20);
    expect(result!.servings).toEqual(2);
    expect(result!.category).toEqual('main_course');
  });

  it('should handle nullable fields correctly', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      description: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.prep_time_minutes).toBeNull();
    expect(result!.cook_time_minutes).toBeNull();
    expect(result!.servings).toBeNull();
  });

  it('should persist changes to database', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Database Persisted Title',
      category: 'appetizer',
      user_id: testUserId
    };

    await updateRecipe(input);

    // Query database directly to verify changes
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('Database Persisted Title');
    expect(recipes[0].category).toEqual('appetizer');
    expect(recipes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const originalRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Updated Title',
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalRecipe[0].updated_at.getTime());
  });

  it('should return null for non-existent recipe', async () => {
    const input: UpdateRecipeInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title',
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeNull();
  });

  it('should return null when recipe belongs to different user', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Updated Title',
      user_id: otherUserId // Different user trying to update
    };

    const result = await updateRecipe(input);

    expect(result).toBeNull();
  });

  it('should not modify recipe when unauthorized user attempts update', async () => {
    const originalRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Malicious Update',
      user_id: otherUserId
    };

    await updateRecipe(input);

    // Verify recipe wasn't changed
    const recipeAfterUpdate = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    expect(recipeAfterUpdate[0].title).toEqual(originalRecipe[0].title);
    expect(recipeAfterUpdate[0].updated_at.getTime()).toEqual(originalRecipe[0].updated_at.getTime());
  });

  it('should handle complex ingredient and instruction arrays', async () => {
    const complexIngredients = [
      '2 cups all-purpose flour',
      '1 tsp baking powder',
      '1/2 cup sugar',
      '2 large eggs',
      '1 cup milk'
    ];

    const complexInstructions = [
      'Preheat oven to 350°F',
      'Mix dry ingredients in a large bowl',
      'In separate bowl, whisk eggs and milk',
      'Combine wet and dry ingredients',
      'Bake for 25-30 minutes'
    ];

    const input: UpdateRecipeInput = {
      id: testRecipeId,
      ingredients: complexIngredients,
      instructions: complexInstructions,
      user_id: testUserId
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.ingredients).toEqual(complexIngredients);
    expect(result!.instructions).toEqual(complexInstructions);
  });

  it('should handle all recipe categories', async () => {
    const categories = [
      'appetizer', 'main_course', 'dessert', 'beverage',
      'breakfast', 'lunch', 'dinner', 'snack',
      'salad', 'soup', 'vegetarian', 'vegan', 'gluten_free'
    ] as const;

    for (const category of categories) {
      const input: UpdateRecipeInput = {
        id: testRecipeId,
        category: category,
        user_id: testUserId
      };

      const result = await updateRecipe(input);
      expect(result).toBeDefined();
      expect(result!.category).toEqual(category);
    }
  });
});
