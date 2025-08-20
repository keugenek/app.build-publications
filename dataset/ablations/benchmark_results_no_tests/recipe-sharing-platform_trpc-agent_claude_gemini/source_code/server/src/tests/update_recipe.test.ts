import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
import { type UpdateRecipeInput } from '../schema';
import { updateRecipe } from '../handlers/update_recipe';
import { eq } from 'drizzle-orm';

describe('updateRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testRecipeId: number;
  let testCategoryIds: number[];

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = users[0].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Breakfast', description: 'Morning meals' },
        { name: 'Lunch', description: 'Afternoon meals' },
        { name: 'Dinner', description: 'Evening meals' }
      ])
      .returning()
      .execute();
    testCategoryIds = categories.map(c => c.id);

    // Create test recipe
    const recipes = await db.insert(recipesTable)
      .values({
        title: 'Original Recipe',
        description: 'Original description',
        ingredients: ['ingredient 1', 'ingredient 2'],
        instructions: ['step 1', 'step 2'],
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        servings: 2,
        user_id: testUserId
      })
      .returning()
      .execute();
    testRecipeId = recipes[0].id;

    // Add initial category relationship
    await db.insert(recipeCategoriesTable)
      .values({
        recipe_id: testRecipeId,
        category_id: testCategoryIds[0]
      })
      .execute();
  });

  it('should update recipe with all fields', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Updated Recipe',
      description: 'Updated description',
      ingredients: ['new ingredient 1', 'new ingredient 2', 'new ingredient 3'],
      instructions: ['new step 1', 'new step 2'],
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 4,
      category_ids: [testCategoryIds[1], testCategoryIds[2]]
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Updated Recipe');
    expect(result!.description).toEqual('Updated description');
    expect(result!.ingredients).toEqual(['new ingredient 1', 'new ingredient 2', 'new ingredient 3']);
    expect(result!.instructions).toEqual(['new step 1', 'new step 2']);
    expect(result!.prep_time_minutes).toEqual(15);
    expect(result!.cook_time_minutes).toEqual(30);
    expect(result!.servings).toEqual(4);
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update recipe with partial fields', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Partially Updated Recipe',
      prep_time_minutes: 25
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Partially Updated Recipe');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.prep_time_minutes).toEqual(25);
    expect(result!.cook_time_minutes).toEqual(20); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update category relationships', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      category_ids: [testCategoryIds[1], testCategoryIds[2]]
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();

    // Verify category relationships were updated
    const categoryRelations = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, testRecipeId))
      .execute();

    expect(categoryRelations).toHaveLength(2);
    const relationCategoryIds = categoryRelations.map(r => r.category_id).sort();
    expect(relationCategoryIds).toEqual([testCategoryIds[1], testCategoryIds[2]].sort());
  });

  it('should clear all category relationships when empty array provided', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      category_ids: []
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();

    // Verify all category relationships were removed
    const categoryRelations = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, testRecipeId))
      .execute();

    expect(categoryRelations).toHaveLength(0);
  });

  it('should not update categories when category_ids not provided', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Updated Title Only'
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Updated Title Only');

    // Verify original category relationships remain unchanged
    const categoryRelations = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, testRecipeId))
      .execute();

    expect(categoryRelations).toHaveLength(1);
    expect(categoryRelations[0].category_id).toEqual(testCategoryIds[0]);
  });

  it('should handle null values correctly', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      description: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.prep_time_minutes).toBeNull();
    expect(result!.cook_time_minutes).toBeNull();
    expect(result!.servings).toBeNull();
  });

  it('should return null for non-existent recipe', async () => {
    const input: UpdateRecipeInput = {
      id: 99999,
      title: 'Non-existent Recipe'
    };

    const result = await updateRecipe(input);

    expect(result).toBeNull();
  });

  it('should update recipe in database', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      title: 'Database Updated Recipe',
      servings: 6
    };

    const result = await updateRecipe(input);

    expect(result).toBeDefined();

    // Verify changes persisted to database
    const dbRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, testRecipeId))
      .execute();

    expect(dbRecipe).toHaveLength(1);
    expect(dbRecipe[0].title).toEqual('Database Updated Recipe');
    expect(dbRecipe[0].servings).toEqual(6);
    expect(dbRecipe[0].updated_at).toBeInstanceOf(Date);
    // Verify updated_at was actually updated
    expect(dbRecipe[0].updated_at.getTime()).toBeGreaterThan(dbRecipe[0].created_at.getTime());
  });

  it('should handle foreign key constraint violations gracefully', async () => {
    const input: UpdateRecipeInput = {
      id: testRecipeId,
      category_ids: [99999] // Non-existent category
    };

    await expect(updateRecipe(input)).rejects.toThrow(/foreign key constraint/i);
  });
});
