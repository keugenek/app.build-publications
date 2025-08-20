import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createUserInputSchema,
  createTagInputSchema,
  createCollectionInputSchema,
  createBookmarkInputSchema,
  updateBookmarkInputSchema,
  searchBookmarksInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createTag } from './handlers/create_tag';
import { getUserTags } from './handlers/get_user_tags';
import { createCollection } from './handlers/create_collection';
import { getUserCollections } from './handlers/get_user_collections';
import { createBookmark } from './handlers/create_bookmark';
import { updateBookmark } from './handlers/update_bookmark';
import { deleteBookmark } from './handlers/delete_bookmark';
import { getUserBookmarks } from './handlers/get_user_bookmarks';
import { searchBookmarks } from './handlers/search_bookmarks';
import { getBookmarkById } from './handlers/get_bookmark_by_id';

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

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Tag management
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),

  getUserTags: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserTags(input.userId)),

  // Collection management
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),

  getUserCollections: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserCollections(input.userId)),

  // Bookmark management
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),

  updateBookmark: publicProcedure
    .input(updateBookmarkInputSchema)
    .mutation(({ input }) => updateBookmark(input)),

  deleteBookmark: publicProcedure
    .input(z.object({ bookmarkId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteBookmark(input.bookmarkId, input.userId)),

  getBookmarkById: publicProcedure
    .input(z.object({ bookmarkId: z.number(), userId: z.number() }))
    .query(({ input }) => getBookmarkById(input.bookmarkId, input.userId)),

  getUserBookmarks: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserBookmarks(input.userId)),

  // Search functionality
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
