import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { getRecipes } from '../handlers/get_recipes';
import { eq } from 'drizzle-orm';

// Sample recipes for testing
const recipe1 = {
  title: 'Pancakes',
  ingredients: ['flour', 'milk', 'egg'],
  instructions: 'Mix and fry.',
  categories: ['breakfast']
};

const recipe2 = {
  title: 'Salad',
  ingredients: ['lettuce', 'tomato', 'cucumber'],
  instructions: 'Chop and toss.',
  categories: ['lunch', 'healthy']
};

describe('getRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(Array.isArray(result)).toBeTrue();
    expect(result).toHaveLength(0);
  });

  it('should fetch all recipes from the database', async () => {
    // Insert two recipes directly using drizzle
    const inserted = await db
      .insert(recipesTable)
      .values([recipe1, recipe2])
      .returning()
      .execute();

    // Ensure they were inserted
    expect(inserted).toHaveLength(2);

    const result = await getRecipes();
    expect(result).toHaveLength(2);

    // Verify that each returned recipe matches one of the inserted records
    const titles = result.map((r) => r.title).sort();
    expect(titles).toEqual(['Pancakes', 'Salad']);

    // Check structure of a recipe
    const first = result.find((r) => r.title === 'Pancakes') as Recipe;
    expect(first).toBeDefined();
    expect(first.ingredients).toEqual(['flour', 'milk', 'egg']);
    expect(first.instructions).toBe('Mix and fry.');
    expect(first.categories).toEqual(['breakfast']);
    expect(first.id).toBeDefined();
    expect(first.created_at).toBeInstanceOf(Date);
  });
});
