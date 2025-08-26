import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Sample valid input
const testInput: CreateRecipeInput = {
  title: 'Test Pancakes',
  description: 'Fluffy pancakes for testing',
  ingredients: ['flour', 'egg', 'milk'],
  instructions: 'Mix ingredients and cook on skillet.',
  categories: ['breakfast', 'easy'],
  image_url: null,
};

describe('createRecipe handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a recipe and return correct fields', async () => {
    const result = await createRecipe(testInput);

    // Validate returned object fields
    expect(result.id).toBeDefined();
    expect(result.title).toBe(testInput.title);
    expect(result.description).toBe(testInput.description ?? null);
    expect(result.ingredients).toEqual(testInput.ingredients);
    expect(result.instructions).toBe(testInput.instructions);
    expect(result.categories).toEqual(testInput.categories);
    expect(result.image_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the recipe in the database', async () => {
    const created = await createRecipe(testInput);

    const rows = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.title).toBe(testInput.title);
    expect(row.description).toBe(testInput.description ?? null);
    expect(row.ingredients).toEqual(testInput.ingredients);
    expect(row.instructions).toBe(testInput.instructions);
    expect(row.categories).toEqual(testInput.categories);
    expect(row.image_url).toBeNull();
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
