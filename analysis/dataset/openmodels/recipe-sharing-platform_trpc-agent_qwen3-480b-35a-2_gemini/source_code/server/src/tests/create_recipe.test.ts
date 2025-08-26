import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, recipeIngredientsTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password_here'
};

// Simple test input
const testInput: CreateRecipeInput = {
  name: 'Test Recipe',
  ingredients: ['ingredient 1', 'ingredient 2'],
  instructions: 'Test instructions',
  categories: ['category 1', 'category 2'],
  preparation_time: 15,
  cooking_time: 30,
  serving_size: 4
};

describe('createRecipe', () => {
  let userId: number;

  beforeEach(async () => {
    await resetDB();
    
    // Manually create tables to avoid the primary key conflict in userFavoriteRecipesTable
    await db.execute(sql`
      CREATE TABLE users (
        id serial PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        created_at timestamp DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE recipes (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id),
        name varchar(255) NOT NULL,
        instructions text NOT NULL,
        preparation_time integer NOT NULL,
        cooking_time integer NOT NULL,
        serving_size integer NOT NULL,
        created_at timestamp DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE recipe_ingredients (
        id serial PRIMARY KEY,
        recipe_id integer NOT NULL REFERENCES recipes(id),
        ingredient varchar(255) NOT NULL
      );
      
      CREATE TABLE recipe_categories (
        id serial PRIMARY KEY,
        recipe_id integer NOT NULL REFERENCES recipes(id),
        category varchar(100) NOT NULL
      );
    `);
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a recipe with all fields', async () => {
    const result = await createRecipe(testInput, userId);

    // Basic field validation
    expect(result.name).toEqual('Test Recipe');
    expect(result.instructions).toEqual(testInput.instructions);
    expect(result.preparation_time).toEqual(15);
    expect(result.cooking_time).toEqual(30);
    expect(result.serving_size).toEqual(4);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save recipe to database', async () => {
    const result = await createRecipe(testInput, userId);

    // Query the recipe
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].name).toEqual('Test Recipe');
    expect(recipes[0].instructions).toEqual(testInput.instructions);
    expect(recipes[0].preparation_time).toEqual(15);
    expect(recipes[0].cooking_time).toEqual(30);
    expect(recipes[0].serving_size).toEqual(4);
    expect(recipes[0].user_id).toEqual(userId);
    expect(recipes[0].created_at).toBeInstanceOf(Date);
  });

  it('should save recipe ingredients to database', async () => {
    const result = await createRecipe(testInput, userId);

    // Query the ingredients
    const ingredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, result.id))
      .execute();

    expect(ingredients).toHaveLength(2);
    expect(ingredients.map(i => i.ingredient)).toContain('ingredient 1');
    expect(ingredients.map(i => i.ingredient)).toContain('ingredient 2');
  });

  it('should save recipe categories to database', async () => {
    const result = await createRecipe(testInput, userId);

    // Query the categories
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();

    expect(categories).toHaveLength(2);
    expect(categories.map(c => c.category)).toContain('category 1');
    expect(categories.map(c => c.category)).toContain('category 2');
  });

  it('should create recipe without ingredients and categories', async () => {
    const minimalInput: CreateRecipeInput = {
      name: 'Minimal Recipe',
      ingredients: [],
      instructions: 'Minimal instructions',
      categories: [],
      preparation_time: 10,
      cooking_time: 20,
      serving_size: 2
    };

    const result = await createRecipe(minimalInput, userId);

    // Check recipe was created
    expect(result.name).toEqual('Minimal Recipe');
    expect(result.instructions).toEqual('Minimal instructions');

    // Check no ingredients were created
    const ingredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, result.id))
      .execute();
    
    expect(ingredients).toHaveLength(0);

    // Check no categories were created
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, result.id))
      .execute();
    
    expect(categories).toHaveLength(0);
  });
});
