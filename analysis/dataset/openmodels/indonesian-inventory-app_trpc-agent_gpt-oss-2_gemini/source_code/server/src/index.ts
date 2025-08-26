import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import {
  createItemInputSchema,
  updateItemInputSchema,
  createInboundInputSchema,
  createOutboundInputSchema,
} from './schema';

import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from './handlers/item';
import { createInbound } from './handlers/inbound';
import { createOutbound } from './handlers/outbound';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Barang (Item) routes
  getItems: publicProcedure.query(() => getItems()),
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),
  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),
  deleteItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteItem(input.id)),
  // Inbound routes
  createInbound: publicProcedure
    .input(createInboundInputSchema)
    .mutation(({ input }) => createInbound(input)),
  // Outbound routes
  createOutbound: publicProcedure
    .input(createOutboundInputSchema)
    .mutation(({ input }) => createOutbound(input)),
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
