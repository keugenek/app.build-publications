import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type RecipeSuggestion } from '../schema';

// Define a set of recipe templates that can be matched against pantry items
const RECIPE_TEMPLATES: Omit<RecipeSuggestion, 'id'>[] = [
  {
    name: "Fruit Salad",
    ingredients: ["Apple", "Banana", "Orange", "Grapes", "Strawberry"],
    instructions: "Chop all fruits into bite-sized pieces and mix together in a bowl. Serve chilled."
  },
  {
    name: "Simple Pasta",
    ingredients: ["Pasta", "Tomato", "Cheese", "Garlic", "Olive Oil"],
    instructions: "Boil pasta according to package instructions. Sauté minced garlic in olive oil, add tomato sauce, then mix with cooked pasta. Sprinkle cheese on top before serving."
  },
  {
    name: "Vegetable Stir Fry",
    ingredients: ["Broccoli", "Carrot", "Bell Pepper", "Soy Sauce", "Garlic", "Ginger"],
    instructions: "Chop vegetables into bite-sized pieces. Heat oil in a wok or large pan, add minced garlic and ginger, then stir-fry vegetables until tender-crisp. Add soy sauce and serve hot."
  },
  {
    name: "Simple Sandwich",
    ingredients: ["Bread", "Cheese", "Lettuce", "Tomato", "Ham"],
    instructions: "Layer cheese, lettuce, tomato slices, and ham between two pieces of bread. Cut in half and serve."
  },
  {
    name: "Rice Bowl",
    ingredients: ["Rice", "Chicken", "Broccoli", "Soy Sauce", "Sesame Oil"],
    instructions: "Cook rice according to package instructions. Sauté chicken until cooked through, add broccoli and cook until tender. Combine with rice, drizzle with soy sauce and sesame oil."
  }
];

export const getRecipeSuggestions = async (): Promise<RecipeSuggestion[]> => {
  try {
    // Get all pantry items from the database
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    // Extract item names for matching (case-insensitive)
    const pantryItemNames = pantryItems.map(item => item.name.toLowerCase());

    // Filter recipes that can be made with available items
    const suggestedRecipes = RECIPE_TEMPLATES.filter(recipe => {
      // Check if we have at least one ingredient for this recipe
      return recipe.ingredients.some(ingredient => 
        pantryItemNames.some(pantryItem => 
          pantryItem.includes(ingredient.toLowerCase()) || 
          ingredient.toLowerCase().includes(pantryItem)
        )
      );
    }).map((recipe, index) => ({
      ...recipe,
      id: index + 1
    }));

    return suggestedRecipes;
  } catch (error) {
    console.error('Failed to generate recipe suggestions:', error);
    throw error;
  }
};
