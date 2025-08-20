import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createPantryItemInputSchema,
  nearExpiryInputSchema,
  updatePantryItemInputSchema,
  suggestRecipesInputSchema,
} from './schema';

// Import handler functions
import { createPantryItem } from './handlers/create_pantry_item';
import { getPantryItems } from './handlers/get_pantry_items';
import { getNearExpiryItems } from './handlers/get_near_expiry_items';
import { updatePantryItem } from './handlers/update_pantry_item';
import { deletePantryItem } from './handlers/delete_pantry_item';
import { suggestRecipes } from './handlers/suggest_recipes';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createPantryItem: publicProcedure
    .input(createPantryItemInputSchema)
    .mutation(({ input }) => createPantryItem(input)),
  getPantryItems: publicProcedure.query(() => getPantryItems()),
  getNearExpiryItems: publicProcedure
    .input(nearExpiryInputSchema)
    .query(({ input }) => getNearExpiryItems(input)),
  updatePantryItem: publicProcedure
    .input(updatePantryItemInputSchema)
    .mutation(({ input }) => updatePantryItem(input)),
  deletePantryItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePantryItem(input.id)),
  suggestRecipes: publicProcedure
    .input(suggestRecipesInputSchema)
    .query(({ input }) => suggestRecipes(input)),
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
