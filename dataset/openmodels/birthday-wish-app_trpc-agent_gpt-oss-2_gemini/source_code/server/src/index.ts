import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { createCardInputSchema, addPhotoInputSchema } from './schema';
import { createCard, getCards } from './handlers/create_card';
import { addPhoto, getPhotosByCard } from './handlers/add_photo';

// Initialize tRPC with superjson transformer for better serialization
const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Define application router with healthcheck, card, and photo procedures
const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Card routes
  createCard: publicProcedure
    .input(createCardInputSchema)
    .mutation(({ input }) => createCard(input)),
  getCards: publicProcedure.query(() => getCards()),
  // Photo routes
  addPhoto: publicProcedure
    .input(addPhotoInputSchema)
    .mutation(({ input }) => addPhoto(input)),
  getPhotosByCard: publicProcedure
    .input(z.object({ card_id: z.number() }))
    .query(({ input }) => getPhotosByCard(input.card_id)),
});

export type AppRouter = typeof appRouter;

// Server start-up
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
