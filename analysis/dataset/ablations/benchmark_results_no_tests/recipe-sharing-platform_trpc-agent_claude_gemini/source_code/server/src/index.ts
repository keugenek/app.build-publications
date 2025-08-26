import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createCategoryInputSchema,
  createRecipeInputSchema,
  updateRecipeInputSchema,
  searchRecipesInputSchema,
  addFavoriteInputSchema,
  removeFavoriteInputSchema,
  getUserFavoritesInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createRecipe } from './handlers/create_recipe';
import { getRecipe } from './handlers/get_recipe';
import { updateRecipe } from './handlers/update_recipe';
import { deleteRecipe } from './handlers/delete_recipe';
import { searchRecipes } from './handlers/search_recipes';
import { getUserRecipes } from './handlers/get_user_recipes';
import { addFavorite } from './handlers/add_favorite';
import { removeFavorite } from './handlers/remove_favorite';
import { getUserFavorites } from './handlers/get_user_favorites';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),

  // Recipe management
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),
  
  getRecipe: publicProcedure
    .input(z.object({ 
      recipeId: z.number(),
      viewingUserId: z.number().optional()
    }))
    .query(({ input }) => getRecipe(input.recipeId, input.viewingUserId)),
  
  updateRecipe: publicProcedure
    .input(updateRecipeInputSchema)
    .mutation(({ input }) => updateRecipe(input)),
  
  deleteRecipe: publicProcedure
    .input(z.object({ 
      recipeId: z.number(),
      userId: z.number()
    }))
    .mutation(({ input }) => deleteRecipe(input.recipeId, input.userId)),
  
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),
  
  getUserRecipes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRecipes(input.userId)),

  // Favorite management
  addFavorite: publicProcedure
    .input(addFavoriteInputSchema)
    .mutation(({ input }) => addFavorite(input)),
  
  removeFavorite: publicProcedure
    .input(removeFavoriteInputSchema)
    .mutation(({ input }) => removeFavorite(input)),
  
  getUserFavorites: publicProcedure
    .input(getUserFavoritesInputSchema)
    .query(({ input }) => getUserFavorites(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Recipe Platform TRPC server listening at port: ${port}`);
}

start();
