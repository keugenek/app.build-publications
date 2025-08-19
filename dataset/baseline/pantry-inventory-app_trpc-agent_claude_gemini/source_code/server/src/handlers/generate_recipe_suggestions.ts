import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type RecipeRequest, type RecipeSuggestionsResponse, type Recipe, type PantryItem } from '../schema';
import { eq, inArray, lte, and, gte } from 'drizzle-orm';

export const generateRecipeSuggestions = async (input: RecipeRequest): Promise<RecipeSuggestionsResponse> => {
  try {
    // Fetch pantry items based on input
    let pantryItems: PantryItem[] = [];
    
    if (input.item_ids && input.item_ids.length > 0) {
      // Fetch specific items by IDs
      const results = await db.select()
        .from(pantryItemsTable)
        .where(inArray(pantryItemsTable.id, input.item_ids))
        .execute();
      
      pantryItems = results.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity), // Convert numeric to number
        expiry_date: new Date(item.expiry_date) // Convert date string to Date object
      }));
    } else {
      // Fetch all pantry items
      const results = await db.select()
        .from(pantryItemsTable)
        .execute();
      
      pantryItems = results.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity), // Convert numeric to number
        expiry_date: new Date(item.expiry_date) // Convert date string to Date object
      }));
    }

    // Identify items expiring within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringResults = await db.select()
      .from(pantryItemsTable)
      .where(
        and(
          lte(pantryItemsTable.expiry_date, sevenDaysFromNow.toISOString().split('T')[0]),
          gte(pantryItemsTable.expiry_date, new Date().toISOString().split('T')[0])
        )
      )
      .execute();
    
    const itemsExpiringSoon = expiringResults.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity), // Convert numeric to number
      expiry_date: new Date(item.expiry_date) // Convert date string to Date object
    }));

    // Generate recipe suggestions based on available ingredients
    const recipes = generateRecipesByIngredients(pantryItems, itemsExpiringSoon, input.max_recipes);

    return {
      recipes,
      pantry_items_used: pantryItems,
      items_expiring_soon: itemsExpiringSoon
    };
  } catch (error) {
    console.error('Recipe suggestion generation failed:', error);
    throw error;
  }
};

// Temporary interface for recipes with scoring
interface ScoredRecipe extends Recipe {
  score: number;
}

// Helper function to generate recipes based on available ingredients
function generateRecipesByIngredients(
  pantryItems: PantryItem[],
  expiringItems: PantryItem[],
  maxRecipes: number
): Recipe[] {
  const recipes: ScoredRecipe[] = [];
  const ingredientNames = pantryItems.map(item => item.name.toLowerCase());
  const expiringNames = expiringItems.map(item => item.name.toLowerCase());

  // Recipe database with ingredient matching
  const recipeDatabase = [
    {
      title: "Tomato Pasta",
      description: "Simple pasta with fresh tomatoes and herbs",
      required_ingredients: ["tomato", "pasta", "garlic", "oil"],
      optional_ingredients: ["cheese", "basil", "onion"],
      instructions: "1. Boil pasta according to package directions. 2. Sauté garlic in oil. 3. Add tomatoes and cook until soft. 4. Combine with pasta and serve.",
      prep_time_minutes: 20,
      difficulty_level: "easy" as const
    },
    {
      title: "Vegetable Stir Fry",
      description: "Quick stir fry with mixed vegetables",
      required_ingredients: ["oil", "garlic"],
      optional_ingredients: ["carrot", "broccoli", "bell pepper", "onion", "soy sauce", "ginger"],
      instructions: "1. Heat oil in a wok. 2. Add garlic and ginger. 3. Add vegetables and stir fry for 5-7 minutes. 4. Season with soy sauce.",
      prep_time_minutes: 15,
      difficulty_level: "easy" as const
    },
    {
      title: "Garden Salad",
      description: "Fresh mixed greens with vegetables",
      required_ingredients: ["lettuce"],
      optional_ingredients: ["tomato", "cucumber", "carrot", "onion", "cheese"],
      instructions: "1. Wash and chop all vegetables. 2. Mix in a large bowl. 3. Add dressing of choice.",
      prep_time_minutes: 10,
      difficulty_level: "easy" as const
    },
    {
      title: "Scrambled Eggs",
      description: "Fluffy scrambled eggs with vegetables",
      required_ingredients: ["egg"],
      optional_ingredients: ["milk", "cheese", "onion", "tomato", "bell pepper"],
      instructions: "1. Beat eggs with milk. 2. Sauté vegetables if using. 3. Add eggs and scramble gently. 4. Add cheese at the end.",
      prep_time_minutes: 8,
      difficulty_level: "easy" as const
    },
    {
      title: "Rice Bowl",
      description: "Nutritious rice bowl with vegetables and protein",
      required_ingredients: ["rice"],
      optional_ingredients: ["egg", "carrot", "broccoli", "soy sauce", "garlic", "oil"],
      instructions: "1. Cook rice according to package directions. 2. Stir fry vegetables. 3. Add cooked egg if using. 4. Serve over rice.",
      prep_time_minutes: 25,
      difficulty_level: "medium" as const
    },
    {
      title: "Vegetable Soup",
      description: "Hearty soup with mixed vegetables",
      required_ingredients: ["broth"],
      optional_ingredients: ["carrot", "onion", "potato", "tomato", "garlic", "herbs"],
      instructions: "1. Sauté onion and garlic. 2. Add other vegetables and broth. 3. Simmer for 20-25 minutes. 4. Season to taste.",
      prep_time_minutes: 35,
      difficulty_level: "medium" as const
    }
  ];

  // Score recipes based on ingredient availability and expiring items
  for (const recipeTemplate of recipeDatabase) {
    const availableRequired = recipeTemplate.required_ingredients.filter(ingredient =>
      ingredientNames.some(name => name.includes(ingredient) || ingredient.includes(name))
    );
    
    const availableOptional = recipeTemplate.optional_ingredients.filter(ingredient =>
      ingredientNames.some(name => name.includes(ingredient) || ingredient.includes(name))
    );

    // Only include recipe if we have at least some required ingredients
    if (availableRequired.length > 0 || availableOptional.length >= 2) {
      const ingredientsUsed = [...availableRequired, ...availableOptional];
      
      // Boost score for recipes using expiring ingredients
      const expiringUsed = ingredientsUsed.filter(ingredient =>
        expiringNames.some(name => name.includes(ingredient) || ingredient.includes(name))
      );
      
      const score = ingredientsUsed.length + (expiringUsed.length * 2);
      
      recipes.push({
        title: recipeTemplate.title,
        description: recipeTemplate.description,
        ingredients_used: ingredientsUsed,
        instructions: recipeTemplate.instructions,
        prep_time_minutes: recipeTemplate.prep_time_minutes,
        difficulty_level: recipeTemplate.difficulty_level,
        score // Add score for sorting
      });
    }
  }

  // Sort by score (prioritizing expiring items) and return top recipes
  return recipes
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecipes)
    .map(({ score, ...recipe }) => recipe); // Remove score from final result
}
