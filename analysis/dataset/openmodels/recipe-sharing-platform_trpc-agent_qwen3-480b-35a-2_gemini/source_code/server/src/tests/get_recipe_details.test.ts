import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB } from '../helpers';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getRecipeDetails } from '../handlers/get_recipe_details';

describe('getRecipeDetails', () => {
  beforeEach(async () => {
    await resetDB();
    
    // Create only the tables we need for this test
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
    
    // Create a test user
    await db.execute(sql`
      INSERT INTO users (email, name, password_hash)
      VALUES ('test@example.com', 'Test User', 'hashed_password');
    `);
    
    // Create a test recipe
    await db.execute(sql`
      INSERT INTO recipes (user_id, name, instructions, preparation_time, cooking_time, serving_size)
      VALUES (1, 'Test Recipe', 'Test instructions', 15, 30, 4);
    `);
    
    // Add ingredients for the recipe
    await db.execute(sql`
      INSERT INTO recipe_ingredients (recipe_id, ingredient)
      VALUES (1, 'Ingredient 1'), (1, 'Ingredient 2');
    `);
    
    // Add categories for the recipe
    await db.execute(sql`
      INSERT INTO recipe_categories (recipe_id, category)
      VALUES (1, 'Category 1'), (1, 'Category 2');
    `);
  });

  afterEach(resetDB);

  it('should fetch recipe details with ingredients and categories', async () => {
    const recipeId = 1; // The first recipe we created
    
    const result = await getRecipeDetails(recipeId);
    
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    
    // Check recipe fields
    expect(result?.id).toBe(recipeId);
    expect(result?.name).toBe('Test Recipe');
    expect(result?.instructions).toBe('Test instructions');
    expect(result?.preparation_time).toBe(15);
    expect(result?.cooking_time).toBe(30);
    expect(result?.serving_size).toBe(4);
    expect(result?.user_id).toBe(1);
    expect(result?.created_at).toBeInstanceOf(Date);
    
    // Check ingredients
    expect(result?.ingredients).toHaveLength(2);
    expect(result?.ingredients[0].ingredient).toBe('Ingredient 1');
    expect(result?.ingredients[1].ingredient).toBe('Ingredient 2');
    
    // Check categories
    expect(result?.categories).toHaveLength(2);
    expect(result?.categories[0].category).toBe('Category 1');
    expect(result?.categories[1].category).toBe('Category 2');
  });

  it('should return null for non-existent recipe', async () => {
    const result = await getRecipeDetails(999); // Non-existent recipe ID
    expect(result).toBeNull();
  });

  it('should handle recipe with no ingredients or categories', async () => {
    // Create a recipe without ingredients or categories
    await db.execute(sql`
      INSERT INTO recipes (user_id, name, instructions, preparation_time, cooking_time, serving_size)
      VALUES (1, 'Empty Recipe', 'Test instructions', 10, 20, 2);
    `);
    
    const recipeId = 2; // The second recipe we created
    
    const result = await getRecipeDetails(recipeId);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Empty Recipe');
    expect(result?.ingredients).toHaveLength(0);
    expect(result?.categories).toHaveLength(0);
  });
});
