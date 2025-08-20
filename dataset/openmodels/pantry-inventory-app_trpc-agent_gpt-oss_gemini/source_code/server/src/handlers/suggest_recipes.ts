import { type SuggestRecipesInput } from '../schema';

// Simple in‑memory recipe lookup. In a real implementation, this could call an AI service or external API.
// Each recipe lists the ingredients required. The handler returns the names of recipes for which all required
// ingredients are present in the input list (case‑insensitive).
const recipeDatabase = [
  { name: 'Fruit Salad', ingredients: ['apple', 'banana', 'orange'] },
  { name: 'Veggie Stir Fry', ingredients: ['broccoli', 'carrot', 'bell pepper'] },
  { name: 'Peanut Butter Sandwich', ingredients: ['bread', 'peanut butter'] },
];

export const suggestRecipes = async (input: SuggestRecipesInput): Promise<string[]> => {
  // Normalise input ingredients to lower case for case‑insensitive matching
  const supplied = input.ingredients.map((i) => i.trim().toLowerCase());

  const matches: string[] = [];
  for (const recipe of recipeDatabase) {
    const required = recipe.ingredients.map((i) => i.toLowerCase());
    const hasAll = required.every((ing) => supplied.includes(ing));
    if (hasAll) {
      matches.push(recipe.name);
    }
  }

  // If no matches, return a fallback suggestion indicating no exact matches.
  if (matches.length === 0) {
    return ['No exact recipe matches found'];
  }
  return matches;
};
