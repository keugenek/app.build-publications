import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { type UpdateRecipeInput } from '../schema';
import { updateRecipe } from '../handlers/update_recipe';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword'
};

const testRecipe = {
  title: 'Original Recipe',
  description: 'Original description',
  instructions: 'Original instructions',
  author_id: 1 // Will be set after user creation
};

const testIngredients = [
  { name: 'Original Ingredient 1', quantity: '1 cup', unit: 'cup' },
  { name: 'Original Ingredient 2', quantity: '2', unit: null }
];

const testCategories = ['Breakfast', 'Vegetarian'] as const;

describe('updateRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let recipeId: number;

  beforeEach(async () => {
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

    // Create test ingredients
    await db.insert(ingredientsTable)
      .values(testIngredients.map(ing => ({
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })))
      .execute();

    // Create test categories
    await db.insert(recipeCategoriesTable)
      .values(testCategories.map(cat => ({
        recipe_id: recipeId,
        category: cat
      })))
      .execute();
  });

  it('should update recipe title only', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Updated Recipe Title'
    };

    const result = await updateRecipe(updateInput);

    expect(result.id).toEqual(recipeId);
    expect(result.title).toEqual('Updated Recipe Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.instructions).toEqual('Original instructions'); // Unchanged
    expect(result.author_id).toEqual(userId);
    expect(result.author_username).toEqual('testuser');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Ingredients and categories should remain unchanged
    expect(result.ingredients).toHaveLength(2);
    expect(result.categories).toHaveLength(2);
    expect(result.categories).toContain('Breakfast');
    expect(result.categories).toContain('Vegetarian');
  });

  it('should update multiple recipe fields', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'New Title',
      description: 'New description',
      instructions: 'New instructions'
    };

    const result = await updateRecipe(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.instructions).toEqual('New instructions');
    expect(result.author_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update ingredients', async () => {
    const newIngredients = [
      { name: 'New Ingredient 1', quantity: '3 tbsp', unit: 'tbsp' },
      { name: 'New Ingredient 2', quantity: '1', unit: 'piece' },
      { name: 'New Ingredient 3', quantity: '2 cups', unit: null }
    ];

    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      ingredients: newIngredients
    };

    const result = await updateRecipe(updateInput);

    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0].name).toEqual('New Ingredient 1');
    expect(result.ingredients[0].quantity).toEqual('3 tbsp');
    expect(result.ingredients[0].unit).toEqual('tbsp');
    expect(result.ingredients[1].name).toEqual('New Ingredient 2');
    expect(result.ingredients[2].unit).toBeNull();

    // Verify old ingredients were deleted
    const dbIngredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, recipeId))
      .execute();
    
    expect(dbIngredients).toHaveLength(3);
    expect(dbIngredients.find(ing => ing.name === 'Original Ingredient 1')).toBeUndefined();
  });

  it('should update categories', async () => {
    const newCategories: ('Dinner' | 'Vegan' | 'Gluten-Free')[] = ['Dinner', 'Vegan', 'Gluten-Free'];

    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      categories: newCategories
    };

    const result = await updateRecipe(updateInput);

    expect(result.categories).toHaveLength(3);
    expect(result.categories).toContain('Dinner');
    expect(result.categories).toContain('Vegan');
    expect(result.categories).toContain('Gluten-Free');
    expect(result.categories).not.toContain('Breakfast');
    expect(result.categories).not.toContain('Vegetarian');

    // Verify old categories were deleted
    const dbCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, recipeId))
      .execute();
    
    expect(dbCategories).toHaveLength(3);
    expect(dbCategories.find(cat => cat.category === 'Breakfast')).toBeUndefined();
  });

  it('should handle empty ingredients array', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      ingredients: []
    };

    const result = await updateRecipe(updateInput);

    expect(result.ingredients).toHaveLength(0);

    // Verify all ingredients were deleted from database
    const dbIngredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, recipeId))
      .execute();
    
    expect(dbIngredients).toHaveLength(0);
  });

  it('should handle empty categories array', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      categories: []
    };

    const result = await updateRecipe(updateInput);

    expect(result.categories).toHaveLength(0);

    // Verify all categories were deleted from database
    const dbCategories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, recipeId))
      .execute();
    
    expect(dbCategories).toHaveLength(0);
  });

  it('should update all fields together', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Complete Update',
      description: 'Completely new description',
      instructions: 'Completely new instructions',
      ingredients: [
        { name: 'Updated Ingredient', quantity: '5 ml', unit: 'ml' }
      ],
      categories: ['Dessert']
    };

    const result = await updateRecipe(updateInput);

    expect(result.title).toEqual('Complete Update');
    expect(result.description).toEqual('Completely new description');
    expect(result.instructions).toEqual('Completely new instructions');
    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].name).toEqual('Updated Ingredient');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual('Dessert');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp even with no changes', async () => {
    const beforeUpdate = new Date();
    
    const updateInput: UpdateRecipeInput = {
      id: recipeId
    };

    const result = await updateRecipe(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should throw error for non-existent recipe', async () => {
    const updateInput: UpdateRecipeInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateRecipe(updateInput)).rejects.toThrow(/recipe not found/i);
  });

  it('should save updated data to database correctly', async () => {
    const updateInput: UpdateRecipeInput = {
      id: recipeId,
      title: 'Database Test Title',
      description: 'Database test description'
    };

    await updateRecipe(updateInput);

    // Verify in database
    const dbRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId))
      .execute();

    expect(dbRecipe).toHaveLength(1);
    expect(dbRecipe[0].title).toEqual('Database Test Title');
    expect(dbRecipe[0].description).toEqual('Database test description');
    expect(dbRecipe[0].instructions).toEqual('Original instructions'); // Unchanged
    expect(dbRecipe[0].updated_at).toBeInstanceOf(Date);
  });
});
