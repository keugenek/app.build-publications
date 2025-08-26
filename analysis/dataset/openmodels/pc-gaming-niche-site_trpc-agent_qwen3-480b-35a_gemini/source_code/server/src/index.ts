import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProductInputSchema, 
  createCategoryInputSchema, 
  createReviewInputSchema,
  updateProductInputSchema,
  updateCategoryInputSchema,
  updateReviewInputSchema
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { createCategory } from './handlers/create_category';
import { createReview } from './handlers/create_review';
import { getProducts } from './handlers/get_products';
import { getCategories } from './handlers/get_categories';
import { getReviews } from './handlers/get_reviews';
import { getProductsByCategory } from './handlers/get_products_by_category';
import { getReviewsByProduct } from './handlers/get_reviews_by_product';

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
  getProductsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ input }) => getProductsByCategory(input.categoryId)),
  
  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  // Review routes
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  getReviews: publicProcedure
    .query(() => getReviews()),
  getReviewsByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(({ input }) => getReviewsByProduct(input.productId)),
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
