import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe, type CreateRecipeInput } from '../schema';
import { getRecipes } from '../handlers/get_recipes';

// Helper to insert a recipe and return the created record
const insertRecipe = async (input: CreateRecipeInput) => {
  const [row] = await db
    .insert(recipesTable)
    .values({
      title: input.title,
      description: input.description ?? null,
      ingredients: input.ingredients,
      instructions: input.instructions,
      categories: input.categories,
      image_url: input.image_url ?? null,
    })
    .returning()
    .execute();
  // Cast jsonb fields to string arrays for the Recipe type
  return {
    ...row,
    ingredients: row.ingredients as unknown as string[],
    categories: row.categories as unknown as string[],
  } as Recipe;
};

const recipeOne: CreateRecipeInput = {
  title: 'Spaghetti Bolognese',
  description: 'Classic Italian pasta',
  ingredients: ['spaghetti', 'ground beef', 'tomato sauce'],
  instructions: 'Cook pasta, prepare sauce, combine.',
  categories: ['Italian', 'Pasta'],
  image_url: null,
};

const recipeTwo: CreateRecipeInput = {
  title: 'Pancakes',
  description: null,
  ingredients: ['flour', 'milk', 'egg'],
  instructions: 'Mix ingredients and fry.',
  categories: ['Breakfast'],
  image_url: null,
};

describe('getRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should retrieve all recipes from the database', async () => {
    const insertedOne = await insertRecipe(recipeOne);
    const insertedTwo = await insertRecipe(recipeTwo);

    const result = await getRecipes();

    // Ensure both recipes are returned (order not guaranteed)
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.id);
    expect(ids).toContain(insertedOne.id);
    expect(ids).toContain(insertedTwo.id);

    // Spot‑check fields of one of the returned recipes
    const fetched = result.find((r) => r.id === insertedOne.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe(recipeOne.title);
    expect(fetched?.ingredients).toEqual(recipeOne.ingredients);
    expect(fetched?.categories).toEqual(recipeOne.categories);
    // created_at should be a Date instance
    expect(fetched?.created_at).toBeInstanceOf(Date);
  });
});
