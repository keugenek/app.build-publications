import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createBookmarkInputSchema, createCollectionInputSchema, createUserInputSchema, searchBookmarksInputSchema, updateBookmarkInputSchema } from './schema';
import { createBookmark } from './handlers/create_bookmark';
import { createCollection } from './handlers/create_collection';
import { createUser } from './handlers/create_user';
import { deleteBookmark } from './handlers/delete_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { searchBookmarks } from './handlers/search_bookmarks';
import { updateBookmark } from './handlers/update_bookmark';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),
  updateBookmark: publicProcedure
    .input(updateBookmarkInputSchema)
    .mutation(({ input }) => updateBookmark(input)),
  deleteBookmark: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBookmark(input.id)),
  getBookmarks: publicProcedure
    .input(z.object({ user_id: z.number() }))
    .query(({ input }) => getBookmarks(input.user_id)),
  searchBookmarks: publicProcedure
    .input(searchBookmarksInputSchema)
    .query(({ input }) => searchBookmarks(input)),
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
