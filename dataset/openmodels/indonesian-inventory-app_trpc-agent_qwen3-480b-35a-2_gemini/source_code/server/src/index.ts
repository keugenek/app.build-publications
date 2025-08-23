import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createItemInputSchema, updateItemInputSchema, deleteItemInputSchema, createTransactionInputSchema } from './schema';
import { createItem } from './handlers/create_item';
import { getItems } from './handlers/get_items';
import { updateItem } from './handlers/update_item';
import { deleteItem } from './handlers/delete_item';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Item routes
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),
  getItems: publicProcedure
    .query(() => getItems()),
  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),
  deleteItem: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteItem(input)),
  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .query(() => getTransactions()),
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
