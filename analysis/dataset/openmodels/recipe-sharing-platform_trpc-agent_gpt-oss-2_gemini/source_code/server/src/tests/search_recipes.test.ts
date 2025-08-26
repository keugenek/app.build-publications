import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';

// Helper to insert a recipe
const insertRecipe = async (input: CreateRecipeInput) => {
  const [result] = await db
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
  return result;
};

const sampleRecipe: CreateRecipeInput = {
  title: 'Spaghetti Bolognese',
  description: 'Classic Italian pasta dish',
  ingredients: ['spaghetti', 'ground beef', 'tomato sauce'],
  instructions: 'Boil pasta, cook sauce, combine.',
  categories: ['Italian', 'Pasta'],
  image_url: undefined,
};

const anotherRecipe: CreateRecipeInput = {
  title: 'Chicken Curry',
  description: 'Spicy Indian curry',
  ingredients: ['chicken', 'curry powder', 'coconut milk'],
  instructions: 'Cook chicken, add spices, simmer.',
  categories: ['Indian', 'Curry'],
  image_url: undefined,
};

describe('searchRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns recipes matching free‑text query on title', async () => {
    await insertRecipe(sampleRecipe);
    await insertRecipe(anotherRecipe);

    const results = await searchRecipes({ query: 'Spaghetti' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Spaghetti Bolognese');
  });

  it('filters by exact ingredient', async () => {
    await insertRecipe(sampleRecipe);
    await insertRecipe(anotherRecipe);

    const results = await searchRecipes({ ingredient: 'curry powder' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Chicken Curry');
  });

  it('filters by category', async () => {
    await insertRecipe(sampleRecipe);
    await insertRecipe(anotherRecipe);

    const results = await searchRecipes({ category: 'Italian' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Spaghetti Bolognese');
  });

  it('combines multiple filters with AND logic', async () => {
    await insertRecipe(sampleRecipe);
    await insertRecipe(anotherRecipe);

    const results = await searchRecipes({
      query: 'Chicken',
      ingredient: 'coconut milk',
      category: 'Curry',
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Chicken Curry');
  });

  it('returns empty array when no filters match', async () => {
    await insertRecipe(sampleRecipe);
    const results = await searchRecipes({ title: 'Non‑existent' });
    expect(results).toHaveLength(0);
  });
});
