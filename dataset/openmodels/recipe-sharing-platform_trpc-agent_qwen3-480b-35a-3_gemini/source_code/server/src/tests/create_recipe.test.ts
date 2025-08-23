import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateRecipeInput = {
  title: 'Test Recipe',
  description: 'A recipe for testing',
  ingredients: ['ingredient 1', 'ingredient 2'],
  instructions: 'Mix all ingredients together.',
  categoryIds: [1, 2],
  imageUrl: null
};

describe('createRecipe', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create some test categories since they're required for recipes
    await db.insert(categoriesTable).values([
      { id: 1, name: 'Breakfast' },
      { id: 2, name: 'Lunch' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should create a recipe', async () => {
    const result = await createRecipe(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Recipe');
    expect(result.description).toEqual(testInput.description);
    expect(result.ingredients).toEqual(testInput.ingredients);
    expect(result.instructions).toEqual(testInput.instructions);
    expect(result.imageUrl).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should save recipe to database', async () => {
    const result = await createRecipe(testInput);

    // Query the recipe from database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('Test Recipe');
    expect(recipes[0].description).toEqual(testInput.description);
    expect(recipes[0].ingredients).toEqual(testInput.ingredients);
    expect(recipes[0].instructions).toEqual(testInput.instructions);
    expect(recipes[0].imageUrl).toBeNull();
    expect(recipes[0].createdAt).toBeInstanceOf(Date);
    expect(recipes[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should create recipe-category associations', async () => {
    const result = await createRecipe(testInput);

    // Query the recipe-category associations
    const associations = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipeId, result.id))
      .execute();

    expect(associations).toHaveLength(2);
    expect(associations.map(a => a.categoryId)).toEqual([1, 2]);
  });

  it('should handle recipe with image URL', async () => {
    const inputWithImage: CreateRecipeInput = {
      ...testInput,
      imageUrl: 'https://example.com/recipe.jpg'
    };

    const result = await createRecipe(inputWithImage);

    expect(result.imageUrl).toEqual('https://example.com/recipe.jpg');

    // Verify in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes[0].imageUrl).toEqual('https://example.com/recipe.jpg');
  });
});
