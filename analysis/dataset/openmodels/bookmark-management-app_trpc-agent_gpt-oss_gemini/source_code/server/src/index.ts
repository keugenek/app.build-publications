import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createCollectionInputSchema,
  createTagInputSchema,
  createBookmarkInputSchema,
  assignTagInputSchema,
  searchBookmarksInputSchema,
} from './schema';

// Import handlers
import { createUser, getUsers } from './handlers/user';
import { createCollection, getCollections } from './handlers/collection';
import { createTag, getTags } from './handlers/tag';
import { createBookmark, getBookmarks } from './handlers/bookmark';
import { assignTag } from './handlers/assignTag';
import { searchBookmarks } from './handlers/searchBookmarks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure.query(() => getUsers()),

  // Collection routes
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),
  getCollections: publicProcedure.query(() => getCollections()),

  // Tag routes
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure.query(() => getTags()),

  // Bookmark routes
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),
  getBookmarks: publicProcedure.query(() => getBookmarks()),

  // Assign tag to bookmark
  assignTag: publicProcedure
    .input(assignTagInputSchema)
    .mutation(({ input }) => assignTag(input)),

  // Search bookmarks
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
