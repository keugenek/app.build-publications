import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const results = await db.select().from(recipesTable).execute();
    
    return results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      imageUrl: recipe.imageUrl,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};
