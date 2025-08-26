import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable, usersTable, recipeIngredientsTable, recipeCategoriesTable } from '../db/schema';
import { type UpdateRecipeInput } from '../schema';
import { updateRecipe } from '../handlers/update_recipe';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Simple DB setup without the problematic table
const createSimpleDB = async () => {
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`create schema public`);
  
  // Create tables manually
  await db.execute(sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE recipes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      instructions TEXT NOT NULL,
      preparation_time INTEGER NOT NULL,
      cooking_time INTEGER NOT NULL,
      serving_size INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE recipe_ingredients (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id),
      ingredient VARCHAR(255) NOT NULL
    );
    
    CREATE TABLE recipe_categories (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id),
      category VARCHAR(100) NOT NULL
    );
  `);
};

describe('updateRecipe', () => {
  beforeEach(async () => {
    await createSimpleDB();
    
    // Create a test user first
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password_here'
      })
      .returning()
      .execute();
    
    const userId = users[0].id;
    
    // Create a test recipe
    await db.insert(recipesTable)
      .values({
        id: 1,
        user_id: userId,
        name: 'Test Recipe',
        instructions: 'Test instructions',
        preparation_time: 10,
        cooking_time: 20,
        serving_size: 4
      })
      .execute();
      
    // Add some ingredients
    await db.insert(recipeIngredientsTable)
      .values([
        { recipe_id: 1, ingredient: 'Ingredient 1' },
        { recipe_id: 1, ingredient: 'Ingredient 2' }
      ])
      .execute();
      
    // Add some categories
    await db.insert(recipeCategoriesTable)
      .values([
        { recipe_id: 1, category: 'Category 1' },
        { recipe_id: 1, category: 'Category 2' }
      ])
      .execute();
  });
  
  afterEach(async () => {
    await resetDB();
  });

  it('should update recipe name and instructions', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      name: 'Updated Recipe Name',
      instructions: 'Updated instructions'
    };

    const result = await updateRecipe(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Updated Recipe Name');
    expect(result.instructions).toBe('Updated instructions');
    expect(result.preparation_time).toBe(10); // Should remain unchanged
    expect(result.cooking_time).toBe(20); // Should remain unchanged
    expect(result.serving_size).toBe(4); // Should remain unchanged
  });

  it('should update recipe times and serving size', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      preparation_time: 15,
      cooking_time: 25,
      serving_size: 6
    };

    const result = await updateRecipe(input);

    expect(result.id).toBe(1);
    expect(result.preparation_time).toBe(15);
    expect(result.cooking_time).toBe(25);
    expect(result.serving_size).toBe(6);
    expect(result.name).toBe('Test Recipe'); // Should remain unchanged
  });

  it('should update ingredients', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      ingredients: ['New Ingredient 1', 'New Ingredient 2', 'New Ingredient 3']
    };

    const result = await updateRecipe(input);

    // Check the recipe was updated (at least it exists)
    expect(result.id).toBe(1);

    // Check ingredients were updated in the database
    const ingredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, 1))
      .execute();

    expect(ingredients).toHaveLength(3);
    expect(ingredients.map(i => i.ingredient)).toEqual([
      'New Ingredient 1',
      'New Ingredient 2', 
      'New Ingredient 3'
    ]);
  });

  it('should update categories', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      categories: ['New Category 1', 'New Category 2']
    };

    const result = await updateRecipe(input);

    // Check the recipe was updated (at least it exists)
    expect(result.id).toBe(1);

    // Check categories were updated in the database
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, 1))
      .execute();

    expect(categories).toHaveLength(2);
    expect(categories.map(c => c.category)).toEqual([
      'New Category 1',
      'New Category 2'
    ]);
  });

  it('should handle empty ingredients and categories arrays', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      ingredients: [],
      categories: []
    };

    const result = await updateRecipe(input);

    expect(result.id).toBe(1);

    // Check ingredients were cleared
    const ingredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, 1))
      .execute();

    expect(ingredients).toHaveLength(0);

    // Check categories were cleared
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, 1))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should throw an error when trying to update a non-existent recipe', async () => {
    const input: UpdateRecipeInput = {
      id: 999,
      name: 'Non-existent recipe'
    };

    await expect(updateRecipe(input)).rejects.toThrow(/not found/);
  });

  it('should not update fields that are not provided', async () => {
    const input: UpdateRecipeInput = {
      id: 1,
      name: 'Only Name Updated'
      // Other fields are not provided, so they should remain unchanged
    };

    const result = await updateRecipe(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Only Name Updated');
    expect(result.instructions).toBe('Test instructions'); // Should remain unchanged
    expect(result.preparation_time).toBe(10); // Should remain unchanged
    expect(result.cooking_time).toBe(20); // Should remain unchanged
    expect(result.serving_size).toBe(4); // Should remain unchanged
  });
});
