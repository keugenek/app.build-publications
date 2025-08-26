import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import {
  createReviewArticleInputSchema,
  updateReviewArticleInputSchema,
  reviewQuerySchema,
  getReviewBySlugInputSchema
} from './schema';
import { createReviewArticle } from './handlers/create_review_article';
import { getReviewArticles } from './handlers/get_review_articles';
import { getReviewBySlug } from './handlers/get_review_by_slug';
import { updateReviewArticle } from './handlers/update_review_article';
import { deleteReviewArticle } from './handlers/delete_review_article';
import { getReviewStats } from './handlers/get_review_stats';

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

  // Review article CRUD operations
  createReviewArticle: publicProcedure
    .input(createReviewArticleInputSchema)
    .mutation(({ input }) => createReviewArticle(input)),

  getReviewArticles: publicProcedure
    .input(reviewQuerySchema)
    .query(({ input }) => getReviewArticles(input)),

  getReviewBySlug: publicProcedure
    .input(getReviewBySlugInputSchema)
    .query(({ input }) => getReviewBySlug(input)),

  updateReviewArticle: publicProcedure
    .input(updateReviewArticleInputSchema)
    .mutation(({ input }) => updateReviewArticle(input)),

  deleteReviewArticle: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteReviewArticle(input.id)),

  // Dashboard statistics
  getReviewStats: publicProcedure
    .query(() => getReviewStats()),

  // Additional utility endpoints
  getPublishedReviews: publicProcedure
    .input(reviewQuerySchema.extend({ published: z.literal(true).optional() }))
    .query(({ input }) => getReviewArticles({ ...input, published: true })),

  getReviewsByCategory: publicProcedure
    .input(z.object({
      category: z.enum(['mice', 'keyboards', 'headsets']),
      limit: z.number().int().positive().max(100).default(20),
      offset: z.number().int().nonnegative().default(0)
    }))
    .query(({ input }) => getReviewArticles({
      category: input.category,
      published: true,
      limit: input.limit,
      offset: input.offset
    }))
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
