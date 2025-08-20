import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  // Create a test user before each test
  beforeEach(async () => {
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;
  });

  const testInput: CreateRecipeInput = {
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    instructions: 'Mix ingredients and cook for 30 minutes.',
    author_id: 0, // Will be set dynamically
    ingredients: [
      { name: 'Flour', quantity: '2', unit: 'cups' },
      { name: 'Sugar', quantity: '1', unit: 'cup' },
      { name: 'Salt', quantity: '1', unit: 'tsp' }
    ],
    categories: ['Breakfast', 'Vegetarian']
  };

  it('should create a recipe with all related data', async () => {
    const input = { ...testInput, author_id: testUserId };
    const result = await createRecipe(input);

    // Verify recipe fields
    expect(result.title).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.instructions).toEqual('Mix ingredients and cook for 30 minutes.');
    expect(result.author_id).toEqual(testUserId);
    expect(result.author_username).toEqual('testuser');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify ingredients
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0].name).toEqual('Flour');
    expect(result.ingredients[0].quantity).toEqual('2');
    expect(result.ingredients[0].unit).toEqual('cups');
    expect(result.ingredients[0].recipe_id).toEqual(result.id);

    // Verify categories
    expect(result.categories).toHaveLength(2);
    expect(result.categories).toContain('Breakfast');
    expect(result.categories).toContain('Vegetarian');
  });

  it('should save recipe to database correctly', async () => {
    const input = { ...testInput, author_id: testUserId };
    const result = await createRecipe(input);

    // Verify recipe in database
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toEqual('Test Recipe');
    expect(recipes[0].author_id).toEqual(testUserId);
    expect(recipes[0].created_at).toBeInstanceOf(Date);
  });

  it('should save ingredients to database correctly', async () => {
    const input = { ...testInput, author_id: testUserId };
    const result = await createRecipe(input);

    // Verify ingredients in database
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, result.id))
      .execute();

    expect(ingredients).toHaveLength(3);
    
    const flourIngredient = ingredients.find(ing => ing.name === 'Flour');
    expect(flourIngredient).toBeDefined();
    expect(flourIngredient!.quantity).toEqual('2');
    expect(flourIngredient!.unit).toEqual('cups');
    expect(flourIngredient!.recipe_id).toEqual(result.id);
  });

  it('should save categories to database correctly', async () => {
    const input = { ...testInput, author_id: testUserId };
    const result = await createRecipe(input);

    // Verify categories in database
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();

    expect(categories).toHaveLength(2);
    const categoryNames = categories.map(cat => cat.category);
    expect(categoryNames).toContain('Breakfast');
    expect(categoryNames).toContain('Vegetarian');
  });

  it('should handle ingredients with null units', async () => {
    const inputWithNullUnit: CreateRecipeInput = {
      ...testInput,
      author_id: testUserId,
      ingredients: [
        { name: 'Egg', quantity: '1', unit: null }
      ]
    };

    const result = await createRecipe(inputWithNullUnit);

    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].name).toEqual('Egg');
    expect(result.ingredients[0].unit).toBeNull();

    // Verify in database
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, result.id))
      .execute();

    expect(ingredients[0].unit).toBeNull();
  });

  it('should handle single category', async () => {
    const inputWithSingleCategory: CreateRecipeInput = {
      ...testInput,
      author_id: testUserId,
      categories: ['Dinner']
    };

    const result = await createRecipe(inputWithSingleCategory);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual('Dinner');
  });

  it('should throw error when author does not exist', async () => {
    const inputWithInvalidAuthor = {
      ...testInput,
      author_id: 99999 // Non-existent user ID
    };

    await expect(createRecipe(inputWithInvalidAuthor)).rejects.toThrow(/Author with ID 99999 does not exist/i);
  });

  it('should handle multiple recipes from same author', async () => {
    const input1 = { ...testInput, author_id: testUserId, title: 'Recipe 1' };
    const input2 = { ...testInput, author_id: testUserId, title: 'Recipe 2' };

    const result1 = await createRecipe(input1);
    const result2 = await createRecipe(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Recipe 1');
    expect(result2.title).toEqual('Recipe 2');
    expect(result1.author_id).toEqual(testUserId);
    expect(result2.author_id).toEqual(testUserId);
  });

  it('should maintain data integrity with transaction rollback on error', async () => {
    // This test verifies that if something goes wrong during creation,
    // no partial data is left in the database
    const input = { ...testInput, author_id: testUserId };

    // First create a successful recipe
    await createRecipe(input);

    // Verify we have data before attempting invalid operation
    const recipesBefore = await db.select().from(recipesTable).execute();
    const ingredientsBefore = await db.select().from(ingredientsTable).execute();

    expect(recipesBefore).toHaveLength(1);
    expect(ingredientsBefore).toHaveLength(3);

    // Now attempt to create with non-existent author (should fail)
    const invalidInput = { ...input, author_id: 99999 };
    await expect(createRecipe(invalidInput)).rejects.toThrow();

    // Verify no additional data was created due to transaction rollback
    const recipesAfter = await db.select().from(recipesTable).execute();
    const ingredientsAfter = await db.select().from(ingredientsTable).execute();

    expect(recipesAfter).toHaveLength(1); // Still only the original recipe
    expect(ingredientsAfter).toHaveLength(3); // Still only the original ingredients
  });
});
