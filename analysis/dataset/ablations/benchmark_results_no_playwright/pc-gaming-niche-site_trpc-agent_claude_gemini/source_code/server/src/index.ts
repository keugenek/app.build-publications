import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createCategoryInputSchema,
  updateCategoryInputSchema,
  deleteCategoryInputSchema,
  getCategoriesQuerySchema,
  createReviewArticleInputSchema,
  updateReviewArticleInputSchema,
  deleteReviewArticleInputSchema,
  getReviewArticlesQuerySchema,
  getReviewArticleByIdQuerySchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createReviewArticle } from './handlers/create_review_article';
import { getReviewArticles } from './handlers/get_review_articles';
import { getReviewArticleById } from './handlers/get_review_article_by_id';
import { updateReviewArticle } from './handlers/update_review_article';
import { deleteReviewArticle } from './handlers/delete_review_article';

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

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .input(getCategoriesQuerySchema)
    .query(({ input }) => getCategories()),

  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  deleteCategory: publicProcedure
    .input(deleteCategoryInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Review article management routes
  createReviewArticle: publicProcedure
    .input(createReviewArticleInputSchema)
    .mutation(({ input }) => createReviewArticle(input)),

  getReviewArticles: publicProcedure
    .input(getReviewArticlesQuerySchema)
    .query(({ input }) => getReviewArticles(input)),

  getReviewArticleById: publicProcedure
    .input(getReviewArticleByIdQuerySchema)
    .query(({ input }) => getReviewArticleById(input)),

  updateReviewArticle: publicProcedure
    .input(updateReviewArticleInputSchema)
    .mutation(({ input }) => updateReviewArticle(input)),

  deleteReviewArticle: publicProcedure
    .input(deleteReviewArticleInputSchema)
    .mutation(({ input }) => deleteReviewArticle(input)),
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
