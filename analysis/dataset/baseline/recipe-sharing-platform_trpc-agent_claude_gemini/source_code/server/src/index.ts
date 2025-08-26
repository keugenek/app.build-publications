import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createRecipeInputSchema,
  updateRecipeInputSchema,
  deleteRecipeInputSchema,
  searchRecipesInputSchema,
  saveRecipeInputSchema,
  unsaveRecipeInputSchema,
  getSavedRecipesInputSchema,
  getRecipeByIdInputSchema,
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createRecipe } from './handlers/create_recipe';
import { getAllRecipes } from './handlers/get_all_recipes';
import { getRecipeById } from './handlers/get_recipe_by_id';
import { updateRecipe } from './handlers/update_recipe';
import { deleteRecipe } from './handlers/delete_recipe';
import { searchRecipes } from './handlers/search_recipes';
import { saveRecipe } from './handlers/save_recipe';
import { unsaveRecipe } from './handlers/unsave_recipe';
import { getSavedRecipes } from './handlers/get_saved_recipes';
import { getUsers } from './handlers/get_users';
import { getRecipesByAuthor } from './handlers/get_recipes_by_author';

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

  // Recipe management
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),

  getAllRecipes: publicProcedure
    .query(() => getAllRecipes()),

  getRecipeById: publicProcedure
    .input(getRecipeByIdInputSchema)
    .query(({ input }) => getRecipeById(input)),

  updateRecipe: publicProcedure
    .input(updateRecipeInputSchema)
    .mutation(({ input }) => updateRecipe(input)),

  deleteRecipe: publicProcedure
    .input(deleteRecipeInputSchema)
    .mutation(({ input }) => deleteRecipe(input)),

  getRecipesByAuthor: publicProcedure
    .input(z.object({ authorId: z.number() }))
    .query(({ input }) => getRecipesByAuthor(input.authorId)),

  // Search functionality
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),

  // Saved recipes (user's personal collection)
  saveRecipe: publicProcedure
    .input(saveRecipeInputSchema)
    .mutation(({ input }) => saveRecipe(input)),

  unsaveRecipe: publicProcedure
    .input(unsaveRecipeInputSchema)
    .mutation(({ input }) => unsaveRecipe(input)),

  getSavedRecipes: publicProcedure
    .input(getSavedRecipesInputSchema)
    .query(({ input }) => getSavedRecipes(input)),
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
