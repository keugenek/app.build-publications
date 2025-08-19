import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createArticleInputSchema,
  updateArticleInputSchema,
  getArticlesByCategoryInputSchema,
  getArticleByIdInputSchema,
  deleteArticleInputSchema
} from './schema';

// Import handlers
import { createArticle } from './handlers/create_article';
import { getArticles } from './handlers/get_articles';
import { getArticlesByCategory } from './handlers/get_articles_by_category';
import { getArticleById } from './handlers/get_article_by_id';
import { updateArticle } from './handlers/update_article';
import { deleteArticle } from './handlers/delete_article';

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

  // CMS Routes for managing articles
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),

  updateArticle: publicProcedure
    .input(updateArticleInputSchema)
    .mutation(({ input }) => updateArticle(input)),

  deleteArticle: publicProcedure
    .input(deleteArticleInputSchema)
    .mutation(({ input }) => deleteArticle(input)),

  // Public Routes for displaying articles
  getArticles: publicProcedure
    .query(() => getArticles()),

  getArticlesByCategory: publicProcedure
    .input(getArticlesByCategoryInputSchema)
    .query(({ input }) => getArticlesByCategory(input)),

  getArticleById: publicProcedure
    .input(getArticleByIdInputSchema)
    .query(({ input }) => getArticleById(input)),
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
