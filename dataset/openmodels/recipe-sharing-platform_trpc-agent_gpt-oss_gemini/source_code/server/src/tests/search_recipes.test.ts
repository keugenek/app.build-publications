import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';

// Helper to create a recipe in the database
async function createRecipe(data: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe> {
  const [inserted] = await db
    .insert(recipesTable)
    .values({
      title: data.title,
      ingredients: data.ingredients,
      instructions: data.instructions,
      categories: data.categories,
    })
    .returning()
    .execute();
  return inserted as Recipe;
}

describe('searchRecipes handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all recipes when no filters are provided', async () => {
    await createRecipe({
      title: 'Spaghetti Bolognese',
      ingredients: ['spaghetti', 'beef', 'tomato'],
      instructions: 'Cook pasta, add sauce',
      categories: ['Italian', 'Dinner'],
    });
    await createRecipe({
      title: 'Pancakes',
      ingredients: ['flour', 'egg', 'milk'],
      instructions: 'Mix and fry',
      categories: ['Breakfast'],
    });

    const results = await searchRecipes({});
    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Spaghetti Bolognese');
    expect(titles).toContain('Pancakes');
  });

  it('filters by title case-insensitively', async () => {
    await createRecipe({
      title: 'Chocolate Cake',
      ingredients: ['cocoa', 'flour', 'sugar'],
      instructions: 'Bake it',
      categories: ['Dessert'],
    });
    await createRecipe({
      title: 'Vanilla Ice Cream',
      ingredients: ['milk', 'vanilla'],
      instructions: 'Freeze it',
      categories: ['Dessert'],
    });

    const results = await searchRecipes({ title: 'chocolate' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Chocolate Cake');
  });

  it('filters by categories (any match)', async () => {
    await createRecipe({
      title: 'Sushi',
      ingredients: ['rice', 'fish'],
      instructions: 'Roll it',
      categories: ['Japanese', 'Dinner'],
    });
    await createRecipe({
      title: 'Miso Soup',
      ingredients: ['miso', 'broth'],
      instructions: 'Boil',
      categories: ['Japanese', 'Soup'],
    });
    await createRecipe({
      title: 'Tacos',
      ingredients: ['tortilla', 'beef'],
      instructions: 'Assemble',
      categories: ['Mexican', 'Lunch'],
    });

    const results = await searchRecipes({ categories: ['Japanese'] });
    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Sushi');
    expect(titles).toContain('Miso Soup');
  });

  it('filters by ingredient substring case-insensitively', async () => {
    await createRecipe({
      title: 'Guacamole',
      ingredients: ['avocado', 'lime', 'salt'],
      instructions: 'Mash',
      categories: ['Mexican', 'Dip'],
    });
    await createRecipe({
      title: 'Avocado Toast',
      ingredients: ['bread', 'avocado', 'pepper'],
      instructions: 'Toast and spread',
      categories: ['Breakfast'],
    });
    await createRecipe({
      title: 'Fruit Salad',
      ingredients: ['apple', 'banana'],
      instructions: 'Mix',
      categories: ['Dessert'],
    });

    const results = await searchRecipes({ ingredient: 'avoc' });
    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Guacamole');
    expect(titles).toContain('Avocado Toast');
  });

  it('applies multiple filters together', async () => {
    await createRecipe({
      title: 'Spicy Ramen',
      ingredients: ['noodles', 'chili', 'broth'],
      instructions: 'Cook noodles',
      categories: ['Japanese', 'Spicy'],
    });
    await createRecipe({
      title: 'Mild Ramen',
      ingredients: ['noodles', 'broth'],
      instructions: 'Cook noodles',
      categories: ['Japanese'],
    });

    const results = await searchRecipes({
      title: 'ramen',
      categories: ['Spicy'],
      ingredient: 'chili',
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Spicy Ramen');
  });
});
