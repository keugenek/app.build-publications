import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginUserInputSchema,
  createCollectionInputSchema,
  updateCollectionInputSchema,
  createTagInputSchema,
  createBookmarkInputSchema,
  updateBookmarkInputSchema,
  searchBookmarksInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createCollection } from './handlers/create_collection';
import { getCollections } from './handlers/get_collections';
import { updateCollection } from './handlers/update_collection';
import { deleteCollection } from './handlers/delete_collection';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { deleteTag } from './handlers/delete_tag';
import { createBookmark } from './handlers/create_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { updateBookmark } from './handlers/update_bookmark';
import { deleteBookmark } from './handlers/delete_bookmark';
import { searchBookmarks } from './handlers/search_bookmarks';
import { getBookmarkTags } from './handlers/get_bookmark_tags';
import { getUserStats } from './handlers/get_user_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUserStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserStats(input.userId)),

  // Collection management
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),

  getCollections: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCollections(input.userId)),

  updateCollection: publicProcedure
    .input(updateCollectionInputSchema)
    .mutation(({ input }) => updateCollection(input)),

  deleteCollection: publicProcedure
    .input(z.object({ collectionId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteCollection(input.collectionId, input.userId)),

  // Tag management
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),

  getTags: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getTags(input.userId)),

  deleteTag: publicProcedure
    .input(z.object({ tagId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteTag(input.tagId, input.userId)),

  // Bookmark management
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),

  getBookmarks: publicProcedure
    .input(z.object({ userId: z.number(), collectionId: z.number().optional() }))
    .query(({ input }) => getBookmarks(input.userId, input.collectionId)),

  updateBookmark: publicProcedure
    .input(updateBookmarkInputSchema)
    .mutation(({ input }) => updateBookmark(input)),

  deleteBookmark: publicProcedure
    .input(z.object({ bookmarkId: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteBookmark(input.bookmarkId, input.userId)),

  getBookmarkTags: publicProcedure
    .input(z.object({ bookmarkId: z.number() }))
    .query(({ input }) => getBookmarkTags(input.bookmarkId)),

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
