import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCategoryInputSchema, 
  updateCategoryInputSchema,
  createReviewInputSchema,
  updateReviewInputSchema,
  loginInputSchema,
  registerInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createReview } from './handlers/create_review';
import { getReviews, getReviewById, getPublishedReviews } from './handlers/get_reviews';
import { updateReview } from './handlers/update_review';
import { deleteReview } from './handlers/delete_review';
import { registerUser, authenticateUser } from './handlers/user_auth';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Category procedures
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  deleteCategory: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCategory(input)),
    
  // Review procedures
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  getReviews: publicProcedure
    .query(() => getReviews()),
  getReviewById: publicProcedure
    .input(z.number())
    .query(({ input }) => getReviewById(input)),
  getPublishedReviews: publicProcedure
    .query(() => getPublishedReviews()),
  updateReview: publicProcedure
    .input(updateReviewInputSchema)
    .mutation(({ input }) => updateReview(input)),
  deleteReview: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteReview(input)),
    
  // User authentication procedures
  registerUser: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => registerUser(input)),
  authenticateUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => authenticateUser(input)),
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
