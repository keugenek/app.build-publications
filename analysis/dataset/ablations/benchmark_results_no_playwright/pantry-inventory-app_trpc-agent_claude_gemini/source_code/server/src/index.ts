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
  getExpiryNotificationsInputSchema,
  markNotificationReadInputSchema,
  createRecipeInputSchema,
  getRecipeSuggestionsInputSchema
} from './schema';

// Import handlers
import { createPantryItem } from './handlers/create_pantry_item';
import { getPantryItems } from './handlers/get_pantry_items';
import { updatePantryItem } from './handlers/update_pantry_item';
import { deletePantryItem } from './handlers/delete_pantry_item';
import { getExpiryNotifications } from './handlers/get_expiry_notifications';
import { markNotificationRead } from './handlers/mark_notification_read';
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { getRecipeSuggestions } from './handlers/get_recipe_suggestions';

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

  // Pantry item management
  createPantryItem: publicProcedure
    .input(createPantryItemInputSchema)
    .mutation(({ input }) => createPantryItem(input)),

  getPantryItems: publicProcedure
    .query(() => getPantryItems()),

  updatePantryItem: publicProcedure
    .input(updatePantryItemInputSchema)
    .mutation(({ input }) => updatePantryItem(input)),

  deletePantryItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePantryItem(input.id)),

  // Notification management
  getExpiryNotifications: publicProcedure
    .input(getExpiryNotificationsInputSchema)
    .query(({ input }) => getExpiryNotifications(input)),

  markNotificationRead: publicProcedure
    .input(markNotificationReadInputSchema)
    .mutation(({ input }) => markNotificationRead(input)),

  // Recipe management
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),

  getRecipes: publicProcedure
    .query(() => getRecipes()),

  getRecipeSuggestions: publicProcedure
    .input(getRecipeSuggestionsInputSchema)
    .query(({ input }) => getRecipeSuggestions(input)),
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
  console.log(`Pantry Management TRPC server listening at port: ${port}`);
}

start();
