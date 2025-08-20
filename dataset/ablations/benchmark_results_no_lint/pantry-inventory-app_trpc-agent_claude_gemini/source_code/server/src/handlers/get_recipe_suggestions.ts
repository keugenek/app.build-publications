import { db } from '../db';
import { pantryItemsTable, recipesTable } from '../db/schema';
import { type RecipeSuggestionsInput, type RecipeSuggestion } from '../schema';
import { gte, desc } from 'drizzle-orm';

export const getRecipeSuggestions = async (input: RecipeSuggestionsInput): Promise<RecipeSuggestion[]> => {
  try {
    // 1. Get all current pantry items (non-expired items only)
    const today = new Date().toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .where(gte(pantryItemsTable.expiration_date, today))
      .execute();

    // Create a set of available ingredient names (case-insensitive)
    const availableIngredients = new Set(
      pantryItems.map(item => item.name.toLowerCase())
    );

    // 2. Get all recipes
    const recipes = await db.select()
      .from(recipesTable)
      .execute();

    // 3. Calculate match information for each recipe
    const recipeSuggestions: RecipeSuggestion[] = [];

    for (const recipe of recipes) {
      const recipeIngredients = recipe.ingredients || [];
      const matchingIngredients: string[] = [];
      const missingIngredients: string[] = [];

      // Check each recipe ingredient against available pantry items
      for (const ingredient of recipeIngredients) {
        if (availableIngredients.has(ingredient.toLowerCase())) {
          matchingIngredients.push(ingredient);
        } else {
          missingIngredients.push(ingredient);
        }
      }

      // Calculate match percentage
      const matchPercentage = recipeIngredients.length > 0 
        ? (matchingIngredients.length / recipeIngredients.length) * 100 
        : 0;

      // 4. Filter recipes that meet the minimum matching ingredients threshold
      if (matchingIngredients.length >= input.min_matching_ingredients) {
        recipeSuggestions.push({
          recipe: {
            ...recipe,
            created_at: recipe.created_at
          },
          matching_ingredients: matchingIngredients,
          missing_ingredients: missingIngredients,
          match_percentage: Math.round(matchPercentage * 100) / 100 // Round to 2 decimal places
        });
      }
    }

    // 5. Return recipes ordered by match percentage (highest first)
    return recipeSuggestions.sort((a, b) => b.match_percentage - a.match_percentage);

  } catch (error) {
    console.error('Recipe suggestions failed:', error);
    throw error;
  }
};
