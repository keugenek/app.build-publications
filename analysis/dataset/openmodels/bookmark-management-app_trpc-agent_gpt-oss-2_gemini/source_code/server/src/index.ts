import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schemas
import {
  createUserInputSchema,
  loginUserInputSchema,
  createBookmarkInputSchema,
  updateBookmarkInputSchema,
  createTagInputSchema,
  updateTagInputSchema,
  createCollectionInputSchema,
  updateCollectionInputSchema,
  assignTagToBookmarkInputSchema,
  assignCollectionToBookmarkInputSchema,
} from './schema';

// Handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createBookmark } from './handlers/create_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { updateBookmark } from './handlers/update_bookmark';
import { deleteBookmark } from './handlers/delete_bookmark';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { updateTag } from './handlers/update_tag';
import { deleteTag } from './handlers/delete_tag';
import { createCollection } from './handlers/create_collection';
import { getCollections } from './handlers/get_collections';
import { updateCollection } from './handlers/update_collection';
import { deleteCollection } from './handlers/delete_collection';
import { assignTagToBookmark } from './handlers/assign_tag_to_bookmark';
import { removeTagFromBookmark } from './handlers/remove_tag_from_bookmark';
import { assignCollectionToBookmark } from './handlers/assign_collection_to_bookmark';
import { removeCollectionFromBookmark } from './handlers/remove_collection_from_bookmark';
import { searchBookmarks } from './handlers/search_bookmarks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // User procedures
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Bookmark procedures
  createBookmark: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input, ctx }) => createBookmark(input, ctx)),
  getBookmarks: publicProcedure
    .query(() => getBookmarks()),
  updateBookmark: publicProcedure
    .input(updateBookmarkInputSchema)
    .mutation(({ input }) => updateBookmark(input)),
  deleteBookmark: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBookmark(input.id)),

  // Tag procedures
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure
    .query(() => getTags()),
  updateTag: publicProcedure
    .input(updateTagInputSchema)
    .mutation(({ input }) => updateTag(input)),
  deleteTag: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTag(input.id)),

  // Collection procedures
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input }) => createCollection(input)),
  getCollections: publicProcedure
    .query(() => getCollections()),
  updateCollection: publicProcedure
    .input(updateCollectionInputSchema)
    .mutation(({ input }) => updateCollection(input)),
  deleteCollection: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCollection(input.id)),

  // Assignment procedures
  assignTagToBookmark: publicProcedure
    .input(assignTagToBookmarkInputSchema)
    .mutation(({ input }) => assignTagToBookmark(input)),
  removeTagFromBookmark: publicProcedure
    .input(assignTagToBookmarkInputSchema)
    .mutation(({ input }) => removeTagFromBookmark(input)),
  assignCollectionToBookmark: publicProcedure
    .input(assignCollectionToBookmarkInputSchema)
    .mutation(({ input }) => assignCollectionToBookmark(input)),
  removeCollectionFromBookmark: publicProcedure
    .input(assignCollectionToBookmarkInputSchema)
    .mutation(({ input }) => removeCollectionFromBookmark(input)),

  // Search procedure
  searchBookmarks: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchBookmarks(input.query)),

  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
