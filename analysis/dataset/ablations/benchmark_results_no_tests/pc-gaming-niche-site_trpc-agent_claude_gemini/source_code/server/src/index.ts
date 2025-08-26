import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createProductReviewInputSchema, 
  updateProductReviewInputSchema,
  getReviewsQuerySchema,
  getReviewByIdSchema,
  deleteReviewInputSchema
} from './schema';

// Import handlers
import { createProductReview } from './handlers/create_product_review';
import { getProductReviews } from './handlers/get_product_reviews';
import { getProductReviewById } from './handlers/get_product_review_by_id';
import { updateProductReview } from './handlers/update_product_review';
import { deleteProductReview } from './handlers/delete_product_review';
import { getCategories } from './handlers/get_categories';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Product review management endpoints
  createProductReview: publicProcedure
    .input(createProductReviewInputSchema)
    .mutation(({ input }) => createProductReview(input)),

  getProductReviews: publicProcedure
    .input(getReviewsQuerySchema)
    .query(({ input }) => getProductReviews(input)),

  getProductReviewById: publicProcedure
    .input(getReviewByIdSchema)
    .query(({ input }) => getProductReviewById(input)),

  updateProductReview: publicProcedure
    .input(updateProductReviewInputSchema)
    .mutation(({ input }) => updateProductReview(input)),

  deleteProductReview: publicProcedure
    .input(deleteReviewInputSchema)
    .mutation(({ input }) => deleteProductReview(input)),

  // Utility endpoints
  getCategories: publicProcedure
    .query(() => getCategories()),
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
  console.log(`Budget PC Gaming Peripherals Review CMS API listening at port: ${port}`);
}

start();
