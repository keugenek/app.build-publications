import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import {
  createRecipeInputSchema,
  recipeIdInputSchema,
  searchRecipesInputSchema,
} from './schema';
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { getRecipeById } from './handlers/get_recipe_by_id';
import { searchRecipes } from './handlers/search_recipes';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Recipe related procedures
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),

  getRecipes: publicProcedure.query(() => getRecipes()),

  getRecipeById: publicProcedure
    .input(recipeIdInputSchema)
    .query(({ input }) => getRecipeById(input)),

  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),
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
