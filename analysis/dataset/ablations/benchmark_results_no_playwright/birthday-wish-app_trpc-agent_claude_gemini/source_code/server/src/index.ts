import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { 
  createBirthdayCardInputSchema, 
  createPhotoInputSchema 
} from './schema';
import { createBirthdayCard } from './handlers/create_birthday_card';
import { getBirthdayCard } from './handlers/get_birthday_card';
import { addPhoto } from './handlers/add_photo';
import { getActiveCards } from './handlers/get_active_cards';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new birthday card
  createBirthdayCard: publicProcedure
    .input(createBirthdayCardInputSchema)
    .mutation(({ input }) => createBirthdayCard(input)),
  
  // Get a specific birthday card with photos
  getBirthdayCard: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .query(({ input }) => getBirthdayCard(input.cardId)),
  
  // Add a photo to an existing birthday card
  addPhoto: publicProcedure
    .input(createPhotoInputSchema)
    .mutation(({ input }) => addPhoto(input)),
  
  // Get all active birthday cards (without photos for listing purposes)
  getActiveCards: publicProcedure
    .query(() => getActiveCards()),
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
