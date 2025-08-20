import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  deleteEntityInputSchema,
  createCollectionInputSchema,
  updateCollectionInputSchema,
  getUserEntityInputSchema,
  createTagInputSchema,
  updateTagInputSchema,
  createBookmarkInputSchema,
  updateBookmarkInputSchema,
  searchBookmarksInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createCollection } from './handlers/create_collection';
import { getCollections } from './handlers/get_collections';
import { updateCollection } from './handlers/update_collection';
import { deleteCollection } from './handlers/delete_collection';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { updateTag } from './handlers/update_tag';
import { deleteTag } from './handlers/delete_tag';
import { createBookmark } from './handlers/create_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { updateBookmark } from './handlers/update_bookmark';
import { deleteBookmark } from './handlers/delete_bookmark';
import { searchBookmarks } from './handlers/search_bookmarks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Collection routes
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),
  getCollections: publicProcedure
    .input(getUserEntityInputSchema)
    .query(({ input }) => getCollections(input)),
  updateCollection: publicProcedure
    .input(updateCollectionInputSchema)
    .mutation(({ input }) => updateCollection(input)),
  deleteCollection: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteCollection(input)),

  // Tag routes
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure
    .input(getUserEntityInputSchema)
    .query(({ input }) => getTags(input)),
  updateTag: publicProcedure
    .input(updateTagInputSchema)
    .mutation(({ input }) => updateTag(input)),
  deleteTag: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteTag(input)),

  // Bookmark routes
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),
  getBookmarks: publicProcedure
    .input(getUserEntityInputSchema)
    .query(({ input }) => getBookmarks(input)),
  updateBookmark: publicProcedure
    .input(updateBookmarkInputSchema)
    .mutation(({ input }) => updateBookmark(input)),
  deleteBookmark: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteBookmark(input)),
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
