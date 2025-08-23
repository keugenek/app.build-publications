import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { getRecipes } from '../handlers/get_recipes';
// import { eq } from 'drizzle-orm';

// Helper to insert a recipe directly
async function insertRecipe(data: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe> {
  const [row] = await db
    .insert(recipesTable)
    .values({
      name: data.name,
      ingredients: data.ingredients,
      instructions: data.instructions,
      categories: data.categories ?? null,
    })
    .returning()
    .execute();
  return row as Recipe;
}

describe('getRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all recipes from the database', async () => {
    const recipe1 = await insertRecipe({
      name: 'Pancakes',
      ingredients: ['flour', 'milk', 'egg'],
      instructions: 'Mix and fry.',
      categories: ['breakfast'],
    });
    const recipe2 = await insertRecipe({
      name: 'Salad',
      ingredients: ['lettuce', 'tomato'],
      instructions: 'Toss together.',
      categories: null,
    });

    const result = await getRecipes();

    // Expect both recipes to be returned (order not guaranteed)
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.id);
    expect(ids).toContain(recipe1.id);
    expect(ids).toContain(recipe2.id);

    const fetched1 = result.find((r) => r.id === recipe1.id)!;
    expect(fetched1.name).toBe('Pancakes');
    expect(fetched1.ingredients).toEqual(['flour', 'milk', 'egg']);
    expect(fetched1.categories).toEqual(['breakfast']);

    const fetched2 = result.find((r) => r.id === recipe2.id)!;
    expect(fetched2.name).toBe('Salad');
    expect(fetched2.categories).toBeNull();
  });

  it('should correctly map database rows to the Recipe type', async () => {
    const now = new Date();
    const [row] = await db
      .insert(recipesTable)
      .values({
        name: 'Soup',
        ingredients: ['water', 'salt'],
        instructions: 'Boil.',
        categories: ['starter'],
      })
      .returning()
      .execute();

    const result = await getRecipes();
    const fetched = result.find((r) => r.id === row.id);
    expect(fetched).toBeDefined();
    // created_at should be a Date instance
    expect(fetched!.created_at).toBeInstanceOf(Date);
    // Ensure the timestamp is recent (within a few seconds of insertion)
    expect(Math.abs(fetched!.created_at.getTime() - now.getTime())).toBeLessThanOrEqual(5000);
  });
});
