import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateRecipeInput = {
  title: 'Test Pancakes',
  ingredients: ['flour', 'egg', 'milk'],
  instructions: 'Mix and fry.',
  categories: ['breakfast', 'easy'],
};

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a recipe and return all fields', async () => {
    const result = await createRecipe(testInput);

    expect(result.title).toBe(testInput.title);
    expect(result.ingredients).toEqual(testInput.ingredients);
    expect(result.instructions).toBe(testInput.instructions);
    expect(result.categories).toEqual(testInput.categories);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the recipe in the database', async () => {
    const result = await createRecipe(testInput);

    const rows = await db.select().from(recipesTable).where(eq(recipesTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.title).toBe(testInput.title);
    expect(row.ingredients).toEqual(testInput.ingredients);
    expect(row.instructions).toBe(testInput.instructions);
    expect(row.categories).toEqual(testInput.categories);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
