import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginUserInputSchema,
  createRecipeInputSchema,
  updateRecipeInputSchema,
  searchRecipesInputSchema,
  addToFavoritesInputSchema,
  removeFromFavoritesInputSchema,
  getUserFavoritesInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createRecipe } from './handlers/create_recipe';
import { getRecipe } from './handlers/get_recipe';
import { getRecipes } from './handlers/get_recipes';
import { updateRecipe } from './handlers/update_recipe';
import { deleteRecipe } from './handlers/delete_recipe';
import { searchRecipes } from './handlers/search_recipes';
import { addToFavorites } from './handlers/add_to_favorites';
import { removeFromFavorites } from './handlers/remove_from_favorites';
import { getUserFavorites } from './handlers/get_user_favorites';
import { getUserRecipes } from './handlers/get_user_recipes';

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
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Recipe CRUD routes
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),

  getRecipe: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRecipe(input.id)),

  getRecipes: publicProcedure
    .query(() => getRecipes()),

  updateRecipe: publicProcedure
    .input(updateRecipeInputSchema)
    .mutation(({ input }) => updateRecipe(input)),

  deleteRecipe: publicProcedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteRecipe(input.id, input.userId)),

  // Search and filter routes
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),

  // User-specific recipe routes
  getUserRecipes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRecipes(input.userId)),

  // Favorites management routes
  addToFavorites: publicProcedure
    .input(addToFavoritesInputSchema)
    .mutation(({ input }) => addToFavorites(input)),

  removeFromFavorites: publicProcedure
    .input(removeFromFavoritesInputSchema)
    .mutation(({ input }) => removeFromFavorites(input)),

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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
