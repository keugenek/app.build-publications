import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type RecipeIdInput } from '../schema';
import { getRecipeById } from '../handlers/get_recipe_by_id';
import { eq } from 'drizzle-orm';

// Sample recipe data for insertion
const sampleRecipe = {
  title: 'Chocolate Cake',
  ingredients: ['flour', 'sugar', 'cocoa powder', 'eggs'],
  instructions: 'Mix ingredients and bake.',
  categories: ['dessert', 'baking'],
};

describe('getRecipeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a recipe when it exists', async () => {
    // Insert recipe directly
    const inserted = await db
      .insert(recipesTable)
      .values(sampleRecipe)
      .returning()
      .execute();

    const recipe = inserted[0];
    const input: RecipeIdInput = { id: recipe.id };

    const result = await getRecipeById(input);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(recipe.id);
    expect(result?.title).toBe(sampleRecipe.title);
    expect(result?.ingredients).toEqual(sampleRecipe.ingredients);
    expect(result?.instructions).toBe(sampleRecipe.instructions);
    expect(result?.categories).toEqual(sampleRecipe.categories);
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null when recipe does not exist', async () => {
    const input: RecipeIdInput = { id: 9999 };
    const result = await getRecipeById(input);
    expect(result).toBeNull();
  });
});
