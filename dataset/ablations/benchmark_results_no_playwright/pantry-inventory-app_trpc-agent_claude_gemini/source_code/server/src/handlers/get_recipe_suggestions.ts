import { db } from '../db';
import { pantryItemsTable, recipesTable } from '../db/schema';
import { type GetRecipeSuggestionsInput, type Recipe } from '../schema';
import { desc } from 'drizzle-orm';

export const getRecipeSuggestions = async (input: GetRecipeSuggestionsInput): Promise<Recipe[]> => {
  try {
    // Get available ingredients - either from input or from pantry
    let availableIngredients: string[];
    
    if (input.available_ingredients && input.available_ingredients.length > 0) {
      availableIngredients = input.available_ingredients.map(ingredient => 
        ingredient.toLowerCase().trim()
      );
    } else {
      // Get all current pantry items as available ingredients
      const pantryItems = await db.select()
        .from(pantryItemsTable)
        .execute();
      
      availableIngredients = pantryItems.map(item => item.name.toLowerCase().trim());
    }

    // If no ingredients available, return empty array
    if (availableIngredients.length === 0) {
      return [];
    }

    // Get all recipes from database
    const allRecipes = await db.select()
      .from(recipesTable)
      .execute();

    // Score each recipe based on ingredient matches
    const scoredRecipes = allRecipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ingredient => 
        ingredient.toLowerCase().trim()
      );
      
      // Count how many recipe ingredients we have available
      const matchedIngredients = recipeIngredients.filter(ingredient =>
        availableIngredients.some(available => 
          // Check for exact match or partial match (available ingredient contains recipe ingredient)
          available === ingredient || 
          available.includes(ingredient) || 
          ingredient.includes(available)
        )
      );

      const matchScore = matchedIngredients.length;
      const totalIngredients = recipeIngredients.length;
      const matchPercentage = totalIngredients > 0 ? (matchScore / totalIngredients) * 100 : 0;

      return {
        recipe,
        matchScore,
        matchPercentage,
        totalIngredients,
        matchedIngredients: matchedIngredients.length
      };
    });

    // Filter recipes that have at least one matching ingredient
    // Sort by match score (most matched ingredients first), then by match percentage
    const filteredAndSorted = scoredRecipes
      .filter(scored => scored.matchScore > 0)
      .sort((a, b) => {
        // Primary sort: number of matched ingredients (descending)
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Secondary sort: match percentage (descending)
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        // Tertiary sort: fewer total ingredients needed (ascending)
        return a.totalIngredients - b.totalIngredients;
      })
      .slice(0, input.max_suggestions);

    // Convert database records to schema format
    return filteredAndSorted.map(scored => ({
      id: scored.recipe.id,
      title: scored.recipe.title,
      description: scored.recipe.description,
      ingredients: scored.recipe.ingredients,
      instructions: scored.recipe.instructions,
      prep_time_minutes: scored.recipe.prep_time_minutes,
      cook_time_minutes: scored.recipe.cook_time_minutes,
      servings: scored.recipe.servings,
      created_at: scored.recipe.created_at
    }));

  } catch (error) {
    console.error('Recipe suggestions retrieval failed:', error);
    throw error;
  }
};
