import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createRecipeInputSchema, 
  searchRecipesInputSchema, 
  createCategoryInputSchema,
  createCustomCategoryInputSchema,
  createBookmarkInputSchema
} from './schema';

// Import handlers
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { searchRecipes } from './handlers/search_recipes';
import { createCategory } from './handlers/create_category';
import { createCustomCategory } from './handlers/create_custom_category';
import { createBookmark } from './handlers/create_bookmark';
import { getUserBookmarks } from './handlers/get_user_bookmarks';
import { getCategories } from './handlers/get_categories';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Recipe routes
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),
  getRecipes: publicProcedure
    .query(() => getRecipes()),
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),
  
  // Category routes
  getCategories: publicProcedure
    .query(() => getCategories()),
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  createCustomCategory: publicProcedure
    .input(createCustomCategoryInputSchema)
    .mutation(({ input }) => createCustomCategory(input)),
  
  // Bookmark routes
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),
  getUserBookmarks: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserBookmarks(input.userId)),
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
