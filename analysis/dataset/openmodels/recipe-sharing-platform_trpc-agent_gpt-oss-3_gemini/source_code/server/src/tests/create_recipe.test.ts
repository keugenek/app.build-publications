import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

// Test inputs
const fullInput: CreateRecipeInput = {
  name: 'Spaghetti Bolognese',
  ingredients: ['spaghetti', 'ground beef', 'tomato sauce'],
  instructions: 'Cook pasta. Prepare sauce. Combine.',
  categories: ['Italian', 'Pasta']
};

// Input without categories (optional field omitted)
const noCategoryInput: CreateRecipeInput = {
  name: 'Plain Omelette',
  ingredients: ['eggs', 'salt', 'butter'],
  instructions: 'Beat eggs. Cook in butter.',
  // categories omitted intentionally
};

describe('createRecipe handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a recipe with all fields', async () => {
    const result = await createRecipe(fullInput);

    // Verify returned object
    expect(result.id).toBeDefined();
    expect(result.name).toBe(fullInput.name);
    expect(result.ingredients).toEqual(fullInput.ingredients);
    expect(result.instructions).toBe(fullInput.instructions);
    expect(result.categories).toEqual(fullInput.categories ?? null ?? null);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify persistence in DB
    const rows = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const stored = rows[0];
    expect(stored.name).toBe(fullInput.name);
    expect(stored.ingredients).toEqual(fullInput.ingredients);
    expect(stored.instructions).toBe(fullInput.instructions);
    expect(stored.categories).toEqual(fullInput.categories ?? null ?? null);
    expect(stored.created_at).toBeInstanceOf(Date);
  });

  it('creates a recipe when categories are omitted (stores null)', async () => {
    const result = await createRecipe(noCategoryInput);

    expect(result.id).toBeDefined();
    expect(result.categories).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);

    const rows = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const stored = rows[0];
    expect(stored.categories).toBeNull();
  });
});
