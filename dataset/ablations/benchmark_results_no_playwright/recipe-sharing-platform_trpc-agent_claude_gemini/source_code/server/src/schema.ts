import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Recipe categories enum
export const recipeCategorySchema = z.enum([
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Dessert',
  'Appetizer',
  'Main Course',
  'Vegetarian',
  'Vegan',
  'Gluten-Free'
]);

export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

// Ingredient schema
export const ingredientSchema = z.object({
  id: z.number(),
  recipe_id: z.number(),
  name: z.string(),
  quantity: z.string(),
  unit: z.string().nullable()
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  author_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Recipe category junction schema
export const recipeCategoryJunctionSchema = z.object({
  id: z.number(),
  recipe_id: z.number(),
  category: recipeCategorySchema
});

export type RecipeCategoryJunction = z.infer<typeof recipeCategoryJunctionSchema>;

// User favorites schema
export const userFavoriteSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  recipe_id: z.number(),
  created_at: z.coerce.date()
});

export type UserFavorite = z.infer<typeof userFavoriteSchema>;

// Input schemas for creating/updating

// User registration input
export const registerUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// User login input
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Create recipe input
export const createRecipeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  instructions: z.string().min(1),
  author_id: z.number(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.string().min(1),
    unit: z.string().nullable()
  })),
  categories: z.array(recipeCategorySchema)
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Update recipe input
export const updateRecipeInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.string().min(1),
    unit: z.string().nullable()
  })).optional(),
  categories: z.array(recipeCategorySchema).optional()
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Search recipes input
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(),
  categories: z.array(recipeCategorySchema).optional(),
  ingredients: z.array(z.string()).optional(),
  author_id: z.number().optional()
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;

// Add to favorites input
export const addToFavoritesInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type AddToFavoritesInput = z.infer<typeof addToFavoritesInputSchema>;

// Remove from favorites input
export const removeFromFavoritesInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type RemoveFromFavoritesInput = z.infer<typeof removeFromFavoritesInputSchema>;

// Get user favorites input
export const getUserFavoritesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserFavoritesInput = z.infer<typeof getUserFavoritesInputSchema>;

// Recipe with relations (for detailed view)
export const recipeWithDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  author_id: z.number(),
  author_username: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  ingredients: z.array(ingredientSchema),
  categories: z.array(recipeCategorySchema)
});

export type RecipeWithDetails = z.infer<typeof recipeWithDetailsSchema>;
