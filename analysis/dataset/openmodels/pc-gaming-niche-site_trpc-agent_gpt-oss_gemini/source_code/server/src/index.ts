import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schemas
import { createCategoryInputSchema, updateCategoryInputSchema, createReviewInputSchema, updateReviewInputSchema } from './schema';

// Handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createReview } from './handlers/create_review';
import { getReviews } from './handlers/get_reviews';
import { updateReview } from './handlers/update_review';
import { deleteReview } from './handlers/delete_review';

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
  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCategory(input.id)),

  // Review routes
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  getReviews: publicProcedure.query(() => getReviews()),
  updateReview: publicProcedure
    .input(updateReviewInputSchema)
    .mutation(({ input }) => updateReview(input)),
  deleteReview: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteReview(input.id)),

  // Healthcheck
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
    createContext: () => ({}),
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
