import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createProductInputSchema, createStockInInputSchema, createStockOutInputSchema } from './schema';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { createStockIn } from './handlers/create_stock_in';
import { createStockOut } from './handlers/create_stock_out';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck route
  healthcheck: publicProcedure.query(() => ({ status: 'ok', timestamp: new Date().toISOString() })),

  // Product routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure.query(() => getProducts()),
  // Stock-in route
  createStockIn: publicProcedure
    .input(createStockInInputSchema)
    .mutation(({ input }) => createStockIn(input)),
  // Stock-out route
  createStockOut: publicProcedure
    .input(createStockOutInputSchema)
    .mutation(({ input }) => createStockOut(input)),


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
