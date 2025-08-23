import { initTRPC } from '@trpc/server';
import { createProductInputSchema, createStockTransactionInputSchema } from './schema';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { createStockTransaction } from './handlers/create_stock_transaction';
import { getStockTransactions } from './handlers/get_stock_transactions';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Product routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure
    .query(() => getProducts()),
  // Stock transaction routes
  createStockTransaction: publicProcedure
    .input(createStockTransactionInputSchema)
    .mutation(({ input }) => createStockTransaction(input)),
  getStockTransactions: publicProcedure
    .query(() => getStockTransactions()),

  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
