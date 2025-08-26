import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  registerUserInputSchema,
  loginInputSchema,
  createRecipeInputSchema,
  updateRecipeInputSchema,
  searchRecipesInputSchema,
  manageFavoriteInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { getRecipeById } from './handlers/get_recipe_by_id';
import { getUserRecipes } from './handlers/get_user_recipes';
import { updateRecipe } from './handlers/update_recipe';
import { deleteRecipe } from './handlers/delete_recipe';
import { searchRecipes } from './handlers/search_recipes';
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

  // User authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Recipe management routes
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),

  getRecipes: publicProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(({ input }) => getRecipes(input.userId)),

  getRecipeById: publicProcedure
    .input(z.object({ 
      recipeId: z.number(),
      userId: z.number().optional()
    }))
    .query(({ input }) => getRecipeById(input.recipeId, input.userId)),

  getUserRecipes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRecipes(input.userId)),

  updateRecipe: publicProcedure
    .input(updateRecipeInputSchema)
    .mutation(({ input }) => updateRecipe(input)),

  deleteRecipe: publicProcedure
    .input(z.object({ 
      recipeId: z.number(),
      userId: z.number()
    }))
    .mutation(({ input }) => deleteRecipe(input.recipeId, input.userId)),

  // Recipe search route
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema.extend({
      currentUserId: z.number().optional()
    }))
    .query(({ input }) => {
      const { currentUserId, ...searchInput } = input;
      return searchRecipes(searchInput, currentUserId);
    }),

  // Favorite management routes
  addFavorite: publicProcedure
    .input(manageFavoriteInputSchema)
    .mutation(({ input }) => addFavorite(input)),

  removeFavorite: publicProcedure
    .input(manageFavoriteInputSchema)
    .mutation(({ input }) => removeFavorite(input)),

  getUserFavorites: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserFavorites(input.userId)),
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
