import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createBookmarkInputSchema,
  createTagInputSchema,
  createCollectionInputSchema,
  addTagToBookmarkInputSchema,
  addBookmarkToCollectionInputSchema,
  searchBookmarksInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createBookmark } from './handlers/create_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { createTag } from './handlers/create_tag';
import { createCollection } from './handlers/create_collection';
import { searchBookmarks } from './handlers/search_bookmarks';
import { addTagToBookmark } from './handlers/add_tag_to_bookmark';
import { addBookmarkToCollection } from './handlers/add_bookmark_to_collection';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  // Bookmark operations
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),
  getBookmarks: publicProcedure
    .query(() => getBookmarks()),
  
  // Tag operations
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  
  // Collection operations
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),
  
  // Search operations
  searchBookmarks: publicProcedure
    .input(searchBookmarksInputSchema)
    .query(({ input }) => searchBookmarks(input)),
  
  // Association operations
  addTagToBookmark: publicProcedure
    .input(addTagToBookmarkInputSchema)
    .mutation(({ input }) => addTagToBookmark(input)),
  addBookmarkToCollection: publicProcedure
    .input(addBookmarkToCollectionInputSchema)
    .mutation(({ input }) => addBookmarkToCollection(input)),
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
