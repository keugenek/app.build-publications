import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type RecipeSuggestionInput, type RecipeSuggestion, type PantryItem } from '../schema';
import { and, inArray, gt } from 'drizzle-orm';

// Recipe database - in a real application, this would be in a separate table
const RECIPES: RecipeSuggestion[] = [
  {
    id: 1,
    name: "Vegetable Stir Fry",
    ingredients: ["Mixed Vegetables", "Soy Sauce", "Rice"],
    instructions: "Stir fry vegetables with soy sauce and serve over rice."
  },
  {
    id: 2,
    name: "Fruit Smoothie",
    ingredients: ["Banana", "Berries", "Milk"],
    instructions: "Blend all fruits with milk until smooth."
  },
  {
    id: 3,
    name: "Simple Pasta",
    ingredients: ["Pasta", "Tomato Sauce", "Cheese"],
    instructions: "Cook pasta and mix with tomato sauce and cheese."
  },
  {
    id: 4,
    name: "Rice and Beans",
    ingredients: ["Rice", "Beans", "Onion"],
    instructions: "Cook rice and beans with chopped onion."
  },
  {
    id: 5,
    name: "Vegetable Soup",
    ingredients: ["Mixed Vegetables", "Broth", "Potatoes"],
    instructions: "Boil all ingredients until vegetables are tender."
  }
];

// Map of ingredients to pantry item categories
const INGREDIENT_CATEGORY_MAP: Record<string, string[]> = {
  "Mixed Vegetables": ["Produce"],
  "Soy Sauce": ["Condiments"],
  "Rice": ["Grains"],
  "Banana": ["Produce"],
  "Berries": ["Produce"],
  "Milk": ["Dairy"],
  "Pasta": ["Grains"],
  "Tomato Sauce": ["Canned Goods"],
  "Cheese": ["Dairy"],
  "Beans": ["Canned Goods"],
  "Onion": ["Produce"],
  "Broth": ["Canned Goods"],
  "Potatoes": ["Produce"]
};

export const getRecipeSuggestions = async (input: RecipeSuggestionInput): Promise<RecipeSuggestion[]> => {
  try {
    // Get pantry items from database
    let pantryItems: PantryItem[] = [];
    
    if (input.pantry_items.length > 0) {
      const results = await db.select()
        .from(pantryItemsTable)
        .where(
          and(
            inArray(pantryItemsTable.id, input.pantry_items),
            gt(pantryItemsTable.quantity, 0)
          )
        )
        .execute();
      
      // Map to our schema type
      pantryItems = results.map(item => ({
        ...item,
        expiry_date: new Date(item.expiry_date),
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      }));
    }

    // Find matching recipes based on available ingredients
    const matchedRecipes: RecipeSuggestion[] = [];
    
    for (const recipe of RECIPES) {
      let matchedIngredients = 0;
      
      for (const ingredient of recipe.ingredients) {
        const validCategories = INGREDIENT_CATEGORY_MAP[ingredient] || [];
        
        // Check if we have any pantry item that matches the category
        const hasMatchingItem = pantryItems.some(item => 
          validCategories.includes(item.category)
        );
        
        if (hasMatchingItem) {
          matchedIngredients++;
        }
      }
      
      // Include recipe if we have at least half the ingredients
      if (matchedIngredients >= recipe.ingredients.length / 2) {
        matchedRecipes.push(recipe);
      }
    }
    
    return matchedRecipes;
  } catch (error) {
    console.error('Recipe suggestion generation failed:', error);
    throw error;
  }
};
