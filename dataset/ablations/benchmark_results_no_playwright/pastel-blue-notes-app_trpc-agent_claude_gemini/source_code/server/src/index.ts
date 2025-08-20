import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  loginUserInputSchema,
  createFolderInputSchema,
  updateFolderInputSchema,
  deleteFolderInputSchema,
  getUserFoldersInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
  deleteNoteInputSchema,
  getUserNotesInputSchema,
  getNotesByFolderInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createFolder } from './handlers/create_folder';
import { updateFolder } from './handlers/update_folder';
import { deleteFolder } from './handlers/delete_folder';
import { getUserFolders } from './handlers/get_user_folders';
import { createNote } from './handlers/create_note';
import { updateNote } from './handlers/update_note';
import { deleteNote } from './handlers/delete_note';
import { getUserNotes } from './handlers/get_user_notes';
import { getNotesByFolder } from './handlers/get_notes_by_folder';

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

  // User authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Folder management routes
  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(({ input }) => createFolder(input)),

  updateFolder: publicProcedure
    .input(updateFolderInputSchema)
    .mutation(({ input }) => updateFolder(input)),

  deleteFolder: publicProcedure
    .input(deleteFolderInputSchema)
    .mutation(({ input }) => deleteFolder(input)),

  getUserFolders: publicProcedure
    .input(getUserFoldersInputSchema)
    .query(({ input }) => getUserFolders(input)),

  // Note management routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),

  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),

  deleteNote: publicProcedure
    .input(deleteNoteInputSchema)
    .mutation(({ input }) => deleteNote(input)),

  getUserNotes: publicProcedure
    .input(getUserNotesInputSchema)
    .query(({ input }) => getUserNotes(input)),

  getNotesByFolder: publicProcedure
    .input(getNotesByFolderInputSchema)
    .query(({ input }) => getNotesByFolder(input)),
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
