import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { suggestRecipes } from '../handlers/suggest_recipes';
import type { SuggestRecipesInput } from '../schema';

// Helper to run suggestion with given ingredients
const runSuggest = async (ingredients: string[]) => {
  const input = { ingredients } as unknown as SuggestRecipesInput;
  return await suggestRecipes(input);
};

describe('suggestRecipes', () => {
  // No DB tables required for this handler, but we keep DB lifecycle for consistency
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns matching recipes when all ingredients are supplied', async () => {
    const result = await runSuggest(['apple', 'banana', 'orange', 'bread', 'peanut butter']);
    // Should include Fruit Salad (requires apple, banana, orange) and Peanut Butter Sandwich
    expect(result).toContain('Fruit Salad');
    expect(result).toContain('Peanut Butter Sandwich');
    // Veggie Stir Fry should not be present because its ingredients are missing
    expect(result).not.toContain('Veggie Stir Fry');
  });

  it('matches ingredients case‑insensitively and trims whitespace', async () => {
    const result = await runSuggest(['  APPLE', 'Banana ', 'OrAnGe']);
    expect(result).toEqual(['Fruit Salad']);
  });

  it('returns fallback message when no recipe matches', async () => {
    const result = await runSuggest(['water', 'salt']);
    expect(result).toEqual(['No exact recipe matches found']);
  });
});
