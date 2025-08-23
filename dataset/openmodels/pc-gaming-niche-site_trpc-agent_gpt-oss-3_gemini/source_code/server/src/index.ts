import { initTRPC } from '@trpc/server';
import { createCategoryInputSchema, updateCategoryInputSchema, createProductInputSchema, updateProductInputSchema, createReviewInputSchema, updateReviewInputSchema } from './schema';
import { createCategory, getCategories, updateCategory } from './handlers/create_category';
import { createProduct, getProducts, updateProduct } from './handlers/create_product';
import { createReview, getReviews, updateReview } from './handlers/create_review';
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
  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure.query(() => getCategories()),
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  // Product routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure.query(() => getProducts()),
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Review routes
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  getReviews: publicProcedure.query(() => getReviews()),
  updateReview: publicProcedure
    .input(updateReviewInputSchema)
    .mutation(({ input }) => updateReview(input)),

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
