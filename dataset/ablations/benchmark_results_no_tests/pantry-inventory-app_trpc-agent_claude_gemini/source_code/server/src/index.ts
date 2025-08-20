import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPantryItemInputSchema,
  updatePantryItemInputSchema,
  getItemsByExpiryInputSchema
} from './schema';

// Import handlers
import { createPantryItem } from './handlers/create_pantry_item';
import { getAllPantryItems } from './handlers/get_all_pantry_items';
import { getItemsWithExpiryStatus } from './handlers/get_items_with_expiry_status';
import { getExpiredItems } from './handlers/get_expired_items';
import { getExpiringSoonItems } from './handlers/get_expiring_soon_items';
import { updatePantryItem } from './handlers/update_pantry_item';
import { deletePantryItem } from './handlers/delete_pantry_item';

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

  // Create a new pantry item
  createPantryItem: publicProcedure
    .input(createPantryItemInputSchema)
    .mutation(({ input }) => createPantryItem(input)),

  // Get all pantry items
  getAllPantryItems: publicProcedure
    .query(() => getAllPantryItems()),

  // Get all items with expiry status calculated
  getItemsWithExpiryStatus: publicProcedure
    .input(getItemsByExpiryInputSchema)
    .query(({ input }) => getItemsWithExpiryStatus(input)),

  // Get only expired items
  getExpiredItems: publicProcedure
    .query(() => getExpiredItems()),

  // Get items expiring soon
  getExpiringSoonItems: publicProcedure
    .input(getItemsByExpiryInputSchema)
    .query(({ input }) => getExpiringSoonItems(input)),

  // Update an existing pantry item
  updatePantryItem: publicProcedure
    .input(updatePantryItemInputSchema)
    .mutation(({ input }) => updatePantryItem(input)),

  // Delete a pantry item
  deletePantryItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePantryItem(input.id)),
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
