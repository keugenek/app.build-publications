import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateRecipeInput, type CreateUserInput } from '../schema';
import { updateRecipe } from '../handlers/update_recipe';

// Test data setup
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

const testRecipe = {
  title: 'Original Recipe',
  description: 'Original description',
  ingredients: ['ingredient 1', 'ingredient 2'],
  instructions: ['step 1', 'step 2'],
  categories: ['breakfast', 'healthy'] as const,
  prep_time_minutes: 10,
  cook_time_minutes: 20,
  servings: 4,
  difficulty: 'easy' as const,
  author_id: 1
};

describe('updateRecipe', () => {
  let userId: number;
  let recipeId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test recipe
    const recipeResult = await db.insert(recipesTable)
      .values({
        ...testRecipe,
        author_id: userId
      })
      .returning()
      .execute();
    recipeId = recipeResult[0].id;
  });

  afterEach(resetDB);

  it('should update a recipe with all fields', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Updated Recipe Title',
      description: 'Updated description',
      ingredients: ['new ingredient 1', 'new ingredient 2', 'new ingredient 3'],
      instructions: ['new step 1', 'new step 2'],
      categories: ['dinner', 'vegetarian'],
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 6,
      difficulty: 'hard'
    };

    const result = await updateRecipe(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(recipeId);
    expect(result.title).toEqual('Updated Recipe Title');
    expect(result.description).toEqual('Updated description');
    expect(result.ingredients).toEqual(['new ingredient 1', 'new ingredient 2', 'new ingredient 3']);
    expect(result.instructions).toEqual(['new step 1', 'new step 2']);
    expect(result.categories).toEqual(['dinner', 'vegetarian']);
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(30);
    expect(result.servings).toEqual(6);
    expect(result.difficulty).toEqual('hard');
    expect(result.author_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'New Title Only',
      servings: 8
    };

    const result = await updateRecipe(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('New Title Only');
    expect(result.servings).toEqual(8);
    
    // Verify other fields remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.ingredients).toEqual(['ingredient 1', 'ingredient 2']);
    expect(result.instructions).toEqual(['step 1', 'step 2']);
    expect(result.categories).toEqual(['breakfast', 'healthy']);
    expect(result.prep_time_minutes).toEqual(10);
    expect(result.cook_time_minutes).toEqual(20);
    expect(result.difficulty).toEqual('easy');
  });

  it('should update description to null', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      description: null
    };

    const result = await updateRecipe(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Original Recipe'); // Other fields unchanged
  });

  it('should update difficulty to null', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      difficulty: null
    };

    const result = await updateRecipe(updateInput);

    expect(result.difficulty).toBeNull();
    expect(result.title).toEqual('Original Recipe'); // Other fields unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const beforeUpdate = new Date();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Timestamp Test'
    };

    const result = await updateRecipe(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
  });

  it('should save updated recipe to database', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Database Persistence Test',
      categories: ['snack', 'keto']
    };

    await updateRecipe(updateInput);

    // Verify changes were persisted in database
    const savedRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    expect(savedRecipe).toHaveLength(1);
    expect(savedRecipe[0].title).toEqual('Database Persistence Test');
    expect(savedRecipe[0].categories).toEqual(['snack', 'keto']);
    expect(savedRecipe[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent recipe', async () => {
    const updateInput: UpdateRecipeInput = {
      id: 99999,
      title: 'Should Fail'
    };

    expect(async () => {
      await updateRecipe(updateInput);
    }).toThrow(/Recipe with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId
    };

    const result = await updateRecipe(updateInput);

    // Should only update the timestamp
    expect(result.id).toEqual(recipeId);
    expect(result.title).toEqual('Original Recipe'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve created_at timestamp', async () => {
    // Get original created_at
    const originalRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    const originalCreatedAt = originalRecipe[0].created_at;

    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Preserve Created At Test'
    };

    const result = await updateRecipe(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).not.toEqual(result.created_at);
  });
});
