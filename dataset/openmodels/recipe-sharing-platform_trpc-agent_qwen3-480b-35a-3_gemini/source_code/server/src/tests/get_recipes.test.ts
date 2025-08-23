import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { getRecipes } from '../handlers/get_recipes';

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(result).toEqual([]);
  });

  it('should return all recipes when recipes exist', async () => {
    // Insert test recipes
    const testRecipes = [
      {
        title: 'Pancakes',
        description: 'Fluffy pancakes',
        ingredients: ['flour', 'eggs', 'milk'],
        instructions: 'Mix and cook',
        imageUrl: 'pancakes.jpg',
      },
      {
        title: 'Salad',
        description: 'Healthy salad',
        ingredients: ['lettuce', 'tomatoes', 'cucumber'],
        instructions: 'Chop and mix',
        imageUrl: null,
      }
    ];

    const insertedRecipes = await Promise.all(
      testRecipes.map(recipe => 
        db.insert(recipesTable)
          .values(recipe)
          .returning()
          .execute()
      )
    );

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    
    // Check that all fields are correctly returned
    result.forEach((recipe, index) => {
      const insertedRecipe = insertedRecipes[index][0];
      expect(recipe.id).toEqual(insertedRecipe.id);
      expect(recipe.title).toEqual(insertedRecipe.title);
      expect(recipe.description).toEqual(insertedRecipe.description);
      expect(recipe.ingredients).toEqual(insertedRecipe.ingredients);
      expect(recipe.instructions).toEqual(insertedRecipe.instructions);
      expect(recipe.imageUrl).toEqual(insertedRecipe.imageUrl);
      expect(recipe.createdAt).toBeInstanceOf(Date);
      expect(recipe.updatedAt).toBeInstanceOf(Date);
    });
  });
});
