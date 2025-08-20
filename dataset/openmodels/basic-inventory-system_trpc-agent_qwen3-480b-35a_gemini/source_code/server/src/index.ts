import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProductInputSchema, 
  updateProductInputSchema,
  createStockTransactionInputSchema
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProduct } from './handlers/get_product';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { createStockTransaction } from './handlers/create_stock_transaction';
import { getStockTransactions } from './handlers/get_stock_transactions';
import { getStockTransactionsByProduct } from './handlers/get_stock_transactions_by_product';
import { updateProductStock } from './handlers/update_product_stock';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Product routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
    
  getProducts: publicProcedure
    .query(() => getProducts()),
    
  getProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProduct(input.id)),
    
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
    
  deleteProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProduct(input.id)),
    
  // Stock transaction routes
  createStockTransaction: publicProcedure
    .input(createStockTransactionInputSchema)
    .mutation(({ input }) => createStockTransaction(input)),
    
  getStockTransactions: publicProcedure
    .query(() => getStockTransactions()),
    
  getStockTransactionsByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(({ input }) => getStockTransactionsByProduct(input.productId)),
    
  updateProductStock: publicProcedure
    .input(z.object({ productId: z.number(), newQuantity: z.number().int().nonnegative() }))
    .mutation(({ input }) => updateProductStock(input.productId, input.newQuantity))
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
