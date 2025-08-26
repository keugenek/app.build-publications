import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createProductInputSchema,
  updateProductInputSchema,
  getProductByIdInputSchema,
  deleteProductInputSchema,
  createStockTransactionInputSchema,
  getTransactionsByProductInputSchema
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { createStockTransaction } from './handlers/create_stock_transaction';
import { getStockTransactions } from './handlers/get_stock_transactions';
import { getTransactionsByProduct } from './handlers/get_transactions_by_product';

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

  // Product management routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  getProductById: publicProcedure
    .input(getProductByIdInputSchema)
    .query(({ input }) => getProductById(input)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  deleteProduct: publicProcedure
    .input(deleteProductInputSchema)
    .mutation(({ input }) => deleteProduct(input)),

  // Stock transaction routes
  createStockTransaction: publicProcedure
    .input(createStockTransactionInputSchema)
    .mutation(({ input }) => createStockTransaction(input)),

  getStockTransactions: publicProcedure
    .query(() => getStockTransactions()),

  getTransactionsByProduct: publicProcedure
    .input(getTransactionsByProductInputSchema)
    .query(({ input }) => getTransactionsByProduct(input)),
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
