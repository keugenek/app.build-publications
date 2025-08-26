import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { createProductInputSchema, updateProductInputSchema, createTransactionInputSchema } from './schema';
import { createProduct } from './handlers/create_product';
import { getProducts as getProductsHandler } from './handlers/get_products';
import { updateProduct as updateProductHandler } from './handlers/update_product';
import { deleteProduct as deleteProductHandler } from './handlers/delete_product';
import { getTransactions as getTransactionsHandler } from './handlers/get_transactions';
import { createTransaction as createTransactionHandler } from './handlers/create_transaction';

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
  // Product handlers
  getProducts: publicProcedure.query(() => getProductsHandler()),
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProductHandler(input)),
  deleteProduct: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => deleteProductHandler(input.id)),

  // Transaction handlers
  getTransactions: publicProcedure.query(() => getTransactionsHandler()),
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransactionHandler(input)),  // Additional handlers can be added similarly

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
