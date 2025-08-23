import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createCategoryInputSchema, createProductInputSchema, createArticleInputSchema } from './schema';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createProduct } from './handlers/create_product';
import { getProducts, getProductsByCategory } from './handlers/get_products';
import { createArticle } from './handlers/create_article';
import { getArticles, getPublishedArticles, getArticleBySlug } from './handlers/get_articles';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),
    
  // Product routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure
    .query(() => getProducts()),
  getProductsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ input }) => getProductsByCategory(input.categoryId)),
    
  // Article routes
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),
  getArticles: publicProcedure
    .query(() => getArticles()),
  getPublishedArticles: publicProcedure
    .query(() => getPublishedArticles()),
  getArticleBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getArticleBySlug(input.slug)),
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
