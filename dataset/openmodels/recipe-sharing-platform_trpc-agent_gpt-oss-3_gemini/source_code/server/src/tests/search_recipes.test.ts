import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type SearchRecipesInput, type Recipe } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';
import { eq } from 'drizzle-orm';

// Helper to insert a recipe directly
async function insertRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>) {
  const result = await db
    .insert(recipesTable)
    .values({
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      categories: recipe.categories ?? null,
    })
    .returning()
    .execute();
  return result[0];
}

describe('searchRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all recipes when query is empty', async () => {
    // Insert two recipes
    await insertRecipe({
      name: 'Spaghetti Bolognese',
      ingredients: ['spaghetti', 'tomato', 'beef'],
      instructions: 'Cook and mix',
      categories: ['Italian']
    });
    await insertRecipe({
      name: 'Pancakes',
      ingredients: ['flour', 'egg', 'milk'],
      instructions: 'Fry on pan',
      categories: null
    });

    const input: SearchRecipesInput = { query: '' };
    const results = await searchRecipes(input);
    expect(results).toHaveLength(2);
  });

  it('finds recipes by name (case‑insensitive)', async () => {
    await insertRecipe({
      name: 'Chocolate Cake',
      ingredients: ['chocolate', 'flour', 'sugar'],
      instructions: 'Bake',
      categories: ['Dessert']
    });

    const input: SearchRecipesInput = { query: 'chocolate' };
    const results = await searchRecipes(input);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Chocolate Cake');
  });

  it('finds recipes by ingredient substring', async () => {
    await insertRecipe({
      name: 'Guacamole',
      ingredients: ['avocado', 'lime', 'salt'],
      instructions: 'Mash',
      categories: ['Mexican']
    });

    const input: SearchRecipesInput = { query: 'avo' };
    const results = await searchRecipes(input);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Guacamole');
  });
});
