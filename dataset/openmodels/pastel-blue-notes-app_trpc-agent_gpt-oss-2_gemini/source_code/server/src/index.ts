import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  deleteByIdInputSchema,
  createFolderInputSchema,
  updateFolderInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
} from './schema';

// Handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';

import { createFolder } from './handlers/create_folder';
import { getFolders } from './handlers/get_folders';
import { updateFolder } from './handlers/update_folder';
import { deleteFolder } from './handlers/delete_folder';

import { createNote } from './handlers/create_note';
import { getNotes } from './handlers/get_notes';
import { updateNote } from './handlers/update_note';
import { deleteNote } from './handlers/delete_note';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure.query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Folder routes
  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(({ input }) => createFolder(input)),
  getFolders: publicProcedure.query(() => getFolders()),
  updateFolder: publicProcedure
    .input(updateFolderInputSchema)
    .mutation(({ input }) => updateFolder(input)),
  deleteFolder: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteFolder(input)),

  // Note routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),
  getNotes: publicProcedure.query(() => getNotes()),
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),
  deleteNote: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteNote(input)),
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
