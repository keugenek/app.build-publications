import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoritesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { favoriteRecipe } from '../handlers/favorite_recipe';
import { type FavoriteRecipeInput } from '../schema';

describe('favoriteRecipe handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should favorite an existing recipe and return it', async () => {
    // Insert a user (id will be 1)
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed',
    }).execute();

    // Insert a recipe
    const [insertedRecipe] = await db
      .insert(recipesTable)
      .values({
        name: 'Pancakes',
        ingredients: ['flour', 'egg', 'milk'],
        instructions: 'Mix and fry.',
        categories: ['breakfast'],
      })
      .returning()
      .execute();

    const input: FavoriteRecipeInput = { recipe_id: insertedRecipe.id };
    const result = await favoriteRecipe(input);

    // Validate returned recipe matches inserted data
    expect(result.id).toBe(insertedRecipe.id);
    expect(result.name).toBe('Pancakes');
    expect(result.ingredients).toEqual(['flour', 'egg', 'milk']);
    expect(result.instructions).toBe('Mix and fry.');
    expect(result.categories).toEqual(['breakfast']);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify favorite record exists
    const favorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.recipe_id, insertedRecipe.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toBe(1);
    expect(favorites[0].recipe_id).toBe(insertedRecipe.id);
  });

  it('should throw an error when recipe does not exist', async () => {
    const input: FavoriteRecipeInput = { recipe_id: 9999 };
    await expect(favoriteRecipe(input)).rejects.toThrow('Recipe not found');
  });
});
