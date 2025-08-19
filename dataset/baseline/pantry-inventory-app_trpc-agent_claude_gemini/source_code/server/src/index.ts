import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createPantryItemInputSchema,
  updatePantryItemInputSchema, 
  deletePantryItemInputSchema,
  recipeRequestSchema,
  expiringItemsRequestSchema
} from './schema';

// Import handlers
import { createPantryItem } from './handlers/create_pantry_item';
import { getPantryItems } from './handlers/get_pantry_items';
import { updatePantryItem } from './handlers/update_pantry_item';
import { deletePantryItem } from './handlers/delete_pantry_item';
import { getExpiringItems } from './handlers/get_expiring_items';
import { generateRecipeSuggestions } from './handlers/generate_recipe_suggestions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Pantry item management endpoints
  createPantryItem: publicProcedure
    .input(createPantryItemInputSchema)
    .mutation(({ input }) => createPantryItem(input)),

  getPantryItems: publicProcedure
    .query(() => getPantryItems()),

  updatePantryItem: publicProcedure
    .input(updatePantryItemInputSchema)
    .mutation(({ input }) => updatePantryItem(input)),

  deletePantryItem: publicProcedure
    .input(deletePantryItemInputSchema)
    .mutation(({ input }) => deletePantryItem(input)),

  // Expiring items endpoint
  getExpiringItems: publicProcedure
    .input(expiringItemsRequestSchema)
    .query(({ input }) => getExpiringItems(input)),

  // Recipe suggestions endpoint
  generateRecipeSuggestions: publicProcedure
    .input(recipeRequestSchema)
    .query(({ input }) => generateRecipeSuggestions(input)),
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
