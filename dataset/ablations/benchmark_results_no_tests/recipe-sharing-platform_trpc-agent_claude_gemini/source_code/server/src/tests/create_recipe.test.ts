import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, usersTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test categories
  const createTestCategories = async () => {
    const result = await db.insert(categoriesTable)
      .values([
        { name: 'Breakfast', description: 'Morning meals' },
        { name: 'Dessert', description: 'Sweet treats' }
      ])
      .returning()
      .execute();
    return result;
  };

  const baseRecipeInput: CreateRecipeInput = {
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: ['2 eggs', '1 cup flour', '1/2 cup milk'],
    instructions: ['Mix ingredients', 'Cook for 10 minutes', 'Serve hot'],
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    servings: 4,
    user_id: 1
  };

  it('should create a recipe with all fields', async () => {
    const user = await createTestUser();
    const input = { ...baseRecipeInput, user_id: user.id };

    const result = await createRecipe(input);

    expect(result.title).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.ingredients).toEqual(['2 eggs', '1 cup flour', '1/2 cup milk']);
    expect(result.instructions).toEqual(['Mix ingredients', 'Cook for 10 minutes', 'Serve hot']);
    expect(result.prep_time_minutes).toEqual(15);
    expect(result.cook_time_minutes).toEqual(10);
    expect(result.servings).toEqual(4);
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save recipe to database', async () => {
    const user = await createTestUser();
    const input = { ...baseRecipeInput, user_id: user.id };

    const result = await createRecipe(input);

    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('Test Recipe');
    expect(recipes[0].user_id).toEqual(user.id);
    expect(recipes[0].ingredients).toEqual(['2 eggs', '1 cup flour', '1/2 cup milk']);
    expect(recipes[0].instructions).toEqual(['Mix ingredients', 'Cook for 10 minutes', 'Serve hot']);
    expect(recipes[0].created_at).toBeInstanceOf(Date);
    expect(recipes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create recipe with nullable fields as null', async () => {
    const user = await createTestUser();
    const input: CreateRecipeInput = {
      title: 'Simple Recipe',
      description: null,
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      user_id: user.id
    };

    const result = await createRecipe(input);

    expect(result.title).toEqual('Simple Recipe');
    expect(result.description).toBeNull();
    expect(result.prep_time_minutes).toBeNull();
    expect(result.cook_time_minutes).toBeNull();
    expect(result.servings).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create recipe with category associations', async () => {
    const user = await createTestUser();
    const categories = await createTestCategories();
    const input = {
      ...baseRecipeInput,
      user_id: user.id,
      category_ids: [categories[0].id, categories[1].id]
    };

    const result = await createRecipe(input);

    // Verify recipe was created
    expect(result.id).toBeDefined();

    // Verify category associations were created
    const recipeCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();

    expect(recipeCategories).toHaveLength(2);
    expect(recipeCategories.map(rc => rc.category_id).sort()).toEqual([categories[0].id, categories[1].id].sort());
  });

  it('should create recipe without categories when category_ids is empty', async () => {
    const user = await createTestUser();
    const input = {
      ...baseRecipeInput,
      user_id: user.id,
      category_ids: []
    };

    const result = await createRecipe(input);

    expect(result.id).toBeDefined();

    // Verify no category associations were created
    const recipeCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();

    expect(recipeCategories).toHaveLength(0);
  });

  it('should create recipe without categories when category_ids is undefined', async () => {
    const user = await createTestUser();
    const input = {
      ...baseRecipeInput,
      user_id: user.id
      // category_ids is undefined
    };

    const result = await createRecipe(input);

    expect(result.id).toBeDefined();

    // Verify no category associations were created
    const recipeCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();

    expect(recipeCategories).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...baseRecipeInput, user_id: 999 };

    await expect(createRecipe(input)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should throw error when category does not exist', async () => {
    const user = await createTestUser();
    const categories = await createTestCategories();
    const input = {
      ...baseRecipeInput,
      user_id: user.id,
      category_ids: [categories[0].id, 999] // 999 doesn't exist
    };

    await expect(createRecipe(input)).rejects.toThrow(/Categories with ids 999 not found/i);
  });

  it('should throw error when multiple categories do not exist', async () => {
    const user = await createTestUser();
    const input = {
      ...baseRecipeInput,
      user_id: user.id,
      category_ids: [998, 999] // Neither exist
    };

    await expect(createRecipe(input)).rejects.toThrow(/Categories with ids 998, 999 not found/i);
  });

  it('should handle mixed existing and non-existing categories', async () => {
    const user = await createTestUser();
    const categories = await createTestCategories();
    const input = {
      ...baseRecipeInput,
      user_id: user.id,
      category_ids: [categories[0].id, 999] // One exists, one doesn't
    };

    await expect(createRecipe(input)).rejects.toThrow(/Categories with ids 999 not found/i);
  });
});
